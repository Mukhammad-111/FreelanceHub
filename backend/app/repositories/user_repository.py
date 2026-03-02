from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


class UserRepository:
    @staticmethod
    async def create(user: User, db: AsyncSession):
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def update(user: User, db: AsyncSession):
        await db.flush()
        return user

    @staticmethod
    async def delete(user: User, db: AsyncSession):
        db.delete(user)

    @staticmethod
    async def get_by_id(user_id: User, db: AsyncSession):
        pass