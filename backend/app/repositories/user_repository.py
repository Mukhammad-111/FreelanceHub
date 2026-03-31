from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    model = User

    @classmethod
    async def get_by_email(cls, email: str, db: AsyncSession):
        result = await db.execute(select(cls.model).where(cls.model.email == email))
        return result.scalar_one_or_none()

    @classmethod
    async def total_users(cls, db: AsyncSession):
        query = select(func.count(cls.model.id))
        result = await db.execute(query)
        return result.scalar()