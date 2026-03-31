from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.repositories.base_repository import BaseRepository


class ProfileRepository(BaseRepository):
    model = Profile

    @classmethod
    async def get_by_user_id(cls, user_id: int, db: AsyncSession):
        result = await db.execute(select(cls.model).where(cls.model.user_id == user_id))
        return result.scalar_one_or_none()