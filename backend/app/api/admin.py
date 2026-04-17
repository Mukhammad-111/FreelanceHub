from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.admin import Stats

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user),
                    db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin")
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    from app.models.order import Order
    from app.models.service import Service
    from app.models.payment import Payment
    
    orders_result = await db.execute(select(Order))
    orders = orders_result.scalars().all()
    
    services_result = await db.execute(select(Service))
    services = services_result.scalars().all()
    
    payments_result = await db.execute(select(Payment))
    payments = payments_result.scalars().all()
    
    return {
        "users_total": len(users),
        "orders_total": len(orders),
        "services_total": len(services),
        "payments_total": len(payments)
    }


@router.get("/users")
async def get_users(current_user: User = Depends(get_current_user),
                   db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin")
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    return {
        "limit": 100,
        "offset": 0,
        "items": [{"id": u.id, "email": u.email, "role": u.role.value, "is_active": u.is_active, "created_at": u.created_at} for u in users]
    }


@router.patch("/users/{user_id}/block")
async def block_user(user_id: int,
                    current_user: User = Depends(get_current_user),
                    db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    await db.commit()
    
    return {"message": "User blocked"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int,
                     current_user: User = Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted"}


@router.patch("/users/{user_id}/make-admin")
async def make_admin(user_id: int,
                     current_user: User = Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin can make admins")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = Role.admin
    await db.commit()
    
    return {"message": f"User {user.email} is now admin"}