from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentCreate


async def payment_create(data: PaymentCreate,
                         db: AsyncSession):
    new_payment = Payment(
        order_id=data.order_id,
        amount=data.amount
    )

    payment = await PaymentRepository.create(new_payment, db)
