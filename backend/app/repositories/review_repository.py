from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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