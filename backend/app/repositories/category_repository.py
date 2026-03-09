from app.models.category import Category
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CategoryRepository:
    @staticmethod
    async def create(category: Category, db: AsyncSession):
        db.add(category)
        await db.flush()
        return category

    @staticmethod
    async def get_by_name(name: str, db: AsyncSession):
        result = await db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(select(Category).order_by(Category.id))
        return result.scalars().all()