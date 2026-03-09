from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order, Status


class OrderRepository:
    @staticmethod
    async def create(order: Order, db: AsyncSession) -> Order:
        db.add(order)
        await db.flush()  # получаем order.id
        return order

    @staticmethod
    async def get_by_id(order_id: int, db: AsyncSession) -> Optional[Order]:
        result = await db.execute(select(Order).where(Order.id == order_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(
        db: AsyncSession,
        page: int = 1,
        limit: int = 10,
        category_id: Optional[int] = None,
        status: Optional[Status] = None,
    ) -> list[Order]:
        query = select(Order)

        if category_id is not None:
            query = query.where(Order.category_id == category_id)

        if status is not None:
            query = query.where(Order.status == status)

        page = max(page, 1)
        limit = max(limit, 1)

        query = query.offset((page - 1) * limit).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def delete(order: Order, db: AsyncSession) -> None:
        await db.delete(order)