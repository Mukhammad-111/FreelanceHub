from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.repositories.base_repository import BaseRepository


class PaymentRepository(BaseRepository):
    model = Payment

    @classmethod
    async def get_by_order_id(
            cls,
            order_id: int,
            db: AsyncSession,
            limit: int = 10,
            offset: int = 0,
    ):
        result = await db.execute(
            select(cls.model)
            .where(cls.model.order_id == order_id)
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()


    @classmethod
    async def total_payments(cls, db: AsyncSession):
        query = select(func.count(cls.model.id))
        result = await db.execute(query)
        return result.scalar()