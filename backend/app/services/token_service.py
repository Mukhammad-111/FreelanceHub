from fastapi import HTTPException
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_access_token
from app.repositories.refresh_token_repository import RefreshTokenRepository


async def generate_auth_tokens(user_id: int, db: AsyncSession):
    access_token = create_access_token({"sub": str(user_id)})
    refresh_token = create_refresh_token(str(user_id))
    refresh_db = await RefreshTokenRepository.create_token(user_id, refresh_token, db)
    await db.commit()
    await db.refresh(refresh_db)

    return {"access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"}


async def refresh_access_token(refresh_t: str, db: AsyncSession):
    try:
        payload = decode_access_token(refresh_t)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_obj = await RefreshTokenRepository.get_by_refresh_token(refresh_t, db)

    if not token_obj:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if token_obj.is_revoked:
        raise HTTPException(status_code=401, detail="Token revoked")

    user_id = str(payload["sub"])
    access_token = create_access_token({"sub": user_id})
    return {"access_token": access_token,
            "token_type": "bearer"}
