from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.response import Response
from app.repositories.base_repository import BaseRepository


class ResponseRepository(BaseRepository):
    model = Response

    @classmethod
    async def get_by_order_id(
            cls,
            order_id: int,
            db: AsyncSession,
            limit: int = 10,
            offset: int = 0):
        result = await db.execute(
            select(cls.model)
            .where(cls.model.order_id == order_id)
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_id_with_order(cls, obj_id: int, db: AsyncSession):
        query = (
            select(cls.model)
            .where(cls.model.id == obj_id)
            .options(joinedload(cls.model.order))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
