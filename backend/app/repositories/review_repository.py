from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.response import Response, ResponseStatus
from app.models.review import Review
from app.repositories.base_repository import BaseRepository


class ReviewRepository(BaseRepository):
    model = Review

    @classmethod
    async def get_by_reviews_user_id(
            cls,
            user_id: int,
            db: AsyncSession,
            limit: int = 10,
            offset: int = 0,
    ):
        result = await db.execute(
            select(cls.model)
            .where(cls.model.reviewed_user_id == user_id)
            .limit(limit)
            .offset(offset))

        return result.scalars().all()

    @classmethod
    async def has_completed_order_between_users(
            cls,
            user1_id: int,
            user2_id: int,
            db: AsyncSession
    ):
        query = (
            select(Order)
            .join(Response, Response.order_id == Order.id)
            .where(
                and_(
                    Order.status.in_([OrderStatus.COMPLETED, OrderStatus.PAID]),
                    Response.status == ResponseStatus.accepted,
                    (
                            ((Order.client_id == user1_id) & (Response.freelancer_id == user2_id)) |
                            ((Order.client_id == user2_id) & (Response.freelancer_id == user1_id))
                    )
                )
            )
        )

        result = await db.execute(query)
        return result.scalars().first()