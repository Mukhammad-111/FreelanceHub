from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:

    model = None

    @classmethod
    async def create(cls, obj, db: AsyncSession):
        db.add(obj)
        await db.flush()
        return obj

    @classmethod
    async def update(cls, obj, data, db: AsyncSession):
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(obj, field, value)

        await db.flush()
        return obj

    @classmethod
    async def delete(cls, obj, db: AsyncSession):
        await db.delete(obj)
        return obj

    @classmethod
    async def get_all(
            cls,
            db: AsyncSession,
            limit: int = 10,
            offset: int = 0):
        result = await db.execute(
            select(cls.model).
            order_by(cls.model.id).
            limit(limit).
            offset(offset))
        return result.scalars().all()

    @classmethod
    async def get_by_id(cls, obj_id: int, db: AsyncSession):
        result = await db.execute(select(cls.model).where(cls.model.id == obj_id))
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_name(cls, obj_name: str, db: AsyncSession):
        result = await db.execute(select(cls.model).where(cls.model.name == obj_name))
        return result.scalar_one_or_none()