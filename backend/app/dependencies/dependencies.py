from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from fastapi import Depends, HTTPException
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.security import decode_access_token


security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security),
                       db: AsyncSession = Depends(get_db)):
    token = credentials.credentials

    try:
        payload = decode_access_token(token=token)
        user_id: int | None = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user