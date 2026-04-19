from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Role
from app.repositories.user_repository import UserRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.service_repository import ServiceRepository
from app.repositories.payment_repository import PaymentRepository


async def admin_stats(db: AsyncSession):
    total_users = await UserRepository.total_users(db)
    total_orders = await OrderRepository.total_orders(db)
    total_services = await ServiceRepository.total_services(db)
    total_payments = await PaymentRepository.total_payments(db)
    return {"users_total": total_users,
            "orders_total": total_orders,
            "services_total": total_services,
            "payments_total": total_payments}


async def users_service(limit: int, offset: int, db: AsyncSession):
    users = await UserRepository.get_all(limit=limit, offset=offset, db=db)
    return users


async def blocked_user(user_id: int, db: AsyncSession):
    user = await UserRepository.get_by_id(user_id, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == Role.admin:
        raise HTTPException(status_code=403, detail="You admin!")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return user


async def user_delete(user_id: int, db: AsyncSession):
    user = await UserRepository.get_by_id(user_id, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User nor found")
    if user.role == Role.admin:
        raise HTTPException(status_code=403, detail="You admin!")
    await UserRepository.delete(user, db)
    await db.commit()