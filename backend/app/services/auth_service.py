from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister


async def register_user(data: UserRegister, db: AsyncSession):
    user = User(**data.model_dump())

    try:
        await UserRepository.create(user, db)
        await db.commit()
        await db.refresh(user)
        return user
    except Exception:
        await db.rollback()
        raise