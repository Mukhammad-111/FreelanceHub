from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.repositories.base_repository import BaseRepository


class ServiceRepository(BaseRepository):
    model = Service

    @classmethod
    async def get_all_filtered(
            cls,
            db: AsyncSession,
            limit: int = 10,
            offset: int = 0,
            category_id: int | None = None):
        query = select(cls.model).order_by(cls.model.id)
        if category_id is not None:
            query = query.where(cls.model.category_id == category_id)
        result = await db.execute(query.limit(limit).offset(offset))
        return result.scalars().all()

    @classmethod
    async def total_services(cls, db: AsyncSession):
        query = select(func.count(cls.model.id))
        result = await db.execute(query)
        return result.scalar()