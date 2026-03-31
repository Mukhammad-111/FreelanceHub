from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.payment import PaymentCreate, PaymentResponseList, PaymentList
from app.services.payment_service import payment_create, payment_get_one, payment_get_all

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponseList)
async def create_payment(data: PaymentCreate,
                         current_user: User = Depends(get_current_user) ,
                         db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.client:
        raise HTTPException(status_code=403, detail="Only client can create payment")
    return await payment_create(data, current_user, db)


@router.get("/{payment_id}", response_model=PaymentResponseList)
async def get_payment(payment_id: int,
                      current_user: User = Depends(get_current_user),
                      db: AsyncSession = Depends(get_db)):
    return await payment_get_one(payment_id, current_user, db)


@router.get("/", response_model=PaymentList)
async def get_payments(order_id: int | None = Query(None, ge=1),
                       current_user: User = Depends(get_current_user),
                       limit: int = Query(10, ge=1, le=10),
                       offset: int = Query(0, ge=0, le=100),
                       db: AsyncSession = Depends(get_db)):
    payments = await payment_get_all(order_id, limit, offset, db)
    return {"limit": limit,
            "offset": offset,
            "items": payments}