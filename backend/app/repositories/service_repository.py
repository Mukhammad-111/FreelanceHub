from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.repositories.base_repository import BaseRepository


class ServiceRepository(BaseRepository):
    model = Service

    @classmethod
    async def total_services(cls, db: AsyncSession):
        query = select(func.count(cls.model.id))
        result = await db.execute(query)
        return result.scalar()