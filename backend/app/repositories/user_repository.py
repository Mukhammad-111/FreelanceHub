from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


class UserRepository:
    @staticmethod
    async def create(user_data: User, db: AsyncSession):
        db.add(user_data)
        await db.flush()
        return user_data

    @staticmethod
    async def update(user: User, db: AsyncSession):
        await db.flush()
        return user

    @staticmethod
    async def delete(user: User, db: AsyncSession):
        db.delete(user)

    @staticmethod
    async def get_by_id(user_id: int, db: AsyncSession):
        request = select(User).where(User.id == user_id)
        result = await db.execute(request)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(email: str, db: AsyncSession):
        request = select(User).where(User.email == email)
        result = await db.execute(request)
        return result.scalar_one_or_none()

    @staticmethod
    async def count_all(db: AsyncSession):
        request = select(User).order_by(User.id)
        result = await db.execute(request)
        return result.scalars().all()

    @staticmethod
    async def count_by_role(role: str, db: AsyncSession):
        request = select(User).where(User.role == role)
        result = await db.execute(request)
        return result.scalar_one_or_none()