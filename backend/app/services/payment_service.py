from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentCreate


async def payment_create(data: PaymentCreate,
                         current_user: User,
                         db: AsyncSession):
    order = await OrderRepository.get_by_id(data.order_id, db)
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order with id:'{data.order_id}' not found")

    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can not pay")

    new_payment = Payment(
        order_id=data.order_id,
        amount=data.amount
    )

    payment = await PaymentRepository.create(new_payment, db)
    payment.status = PaymentStatus.paid
    await db.commit()
    await db.refresh(payment)
    return payment


async def payment_get_one(payment_id: int,
                          current_user: User,
                          db: AsyncSession):
    payment = await PaymentRepository.get_by_id(payment_id, db)
    if payment is None:
        raise HTTPException(status_code=404, detail=f"Payment with id:'{payment_id}' not found")

    order = await OrderRepository.get_by_id(payment.order_id, db)
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your payment")

    return payment


async def payment_get_all(order_id: int | None,
                          limit: int,
                          offset: int,
                          db: AsyncSession):
    if order_id:
        order = await OrderRepository.get_by_id(order_id, db)
        if order is None:
            raise HTTPException(status_code=404, detail=f"Order with id:'{order_id}' not found")
        return await PaymentRepository.get_by_order_id(order_id=order_id,
                                                 limit=limit,
                                                 offset=offset,
                                                 db=db)
    return await PaymentRepository.get_all(db, limit, offset)
