from app.models.service import Service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ServiceRepository:
    @staticmethod
    async def create(service: Service, db: AsyncSession):
        db.add(service)
        await db.flush()
        return service

    @staticmethod
    async def get_by_id(service_id: int, db: AsyncSession):
        result = await db.execute(select(Service).where(Service.id == service_id))
        service = result.scalar_one_or_none()
        return service

    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(select(Service).order_by(Service.id))
        services = result.scalars().all()
        return services

    @staticmethod
    async def update(service_id: int, service: Service, db: AsyncSession):
        await db.flush()
        return service

    @staticmethod
    async def delete(service_id: int, db: AsyncSession):
        service = db.get(Service, service_id)
        await db.delete(service)