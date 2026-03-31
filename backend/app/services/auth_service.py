from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.profile import Profile
from app.repositories.profile_repository import ProfileRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister, UserLogin
from app.core.security import hash_password

from app.core.security import verify_password

from app.schemas.user import UserRefresh
from app.services.token_service import generate_auth_tokens, refresh_access_token


async def register_user(data: UserRegister, db: AsyncSession):
    existing_user = await UserRepository.get_by_email(data.email, db)

    if existing_user:
        raise HTTPException(status_code=409, detail="Email already exists")

    hashed_password = hash_password(data.password)

    new_user = User(
        email=data.email,
        password_hash=hashed_password,
        role=data.role,
        is_active=True
    )
    created_user = await UserRepository.create(new_user, db)
    await db.flush()

    new_profile = Profile(
        user_id=created_user.id,
        name='',
        bio='',
        skills='',
        rating=0.0
    )
    await ProfileRepository.create(new_profile, db)
    await db.commit()
    await db.refresh(created_user)
    return created_user


async def login_user(data: UserLogin, db: AsyncSession):
    user = await UserRepository.get_by_email(data.email, db)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return await generate_auth_tokens(user.id, db)


async def get_me(current_user: User,
                 db: AsyncSession):
    user = await UserRepository.get_by_id(current_user.id, db)
    return user


async def refresh_token(token_data: UserRefresh, db: AsyncSession):
    refresh_t = token_data.refresh_token
    return await refresh_access_token(refresh_t, db)


async def logout_user(current_user: User, db: AsyncSession):
    await RefreshTokenRepository.delete_refresh_token(current_user.id, db)
    await db.commit()


async def delete_user(user_id: int, db: AsyncSession):
    user = await UserRepository.get_by_id(user_id, db)
    if user is None:
        return None

    try:
        await UserRepository.delete(user, db)
        await db.commit()
        return user
    except Exception:
        await db.rollback()
        raise