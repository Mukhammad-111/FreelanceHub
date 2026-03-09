from fastapi import HTTPException
from jose import JWTError
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.profile import Profile
from app.models.refresh_token import RefreshToken
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister, UserLogin
from app.core.security import hash_password

from app.core.security import verify_password

from app.core.security import create_access_token, create_refresh_token

from app.dependencies.dependencies import get_current_user

from app.schemas.user import UserRefresh

from app.core.security import decode_access_token


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
    db.add(new_profile)
    await db.commit()
    await db.refresh(created_user)
    return created_user


async def login_user(data: UserLogin, db: AsyncSession):
    user = await UserRepository.get_by_email(data.email, db)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(str(user.id))
    refresh_db = RefreshToken(token=refresh_token, user_id=user.id)
    db.add(refresh_db)
    await db.commit()

    return {"access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"}


async def refresh_token(token_data: UserRefresh, db: AsyncSession):
    refresh_t = token_data.refresh_token
    try:
        payload = decode_access_token(refresh_t)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_db = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_t))
    token_obj = token_db.scalar_one_or_none()

    if not token_obj:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if token_obj.is_revoked:
        raise HTTPException(status_code=401, detail="Token revoked")

    user_id = str(payload["sub"])
    access_token = create_access_token({"sub": user_id})
    return {"access_token": access_token,
            "token_type": "bearer"}


async def logout_user(current_user: User, db: AsyncSession):
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == current_user.id))
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