from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.schemas.user import UserRegister, UserRegisterResponse

from app.services.auth_service import register_user

router = APIRouter(prefix="/auth")


@router.post("/register")
async def register(
        new_user: UserRegister,
        db: AsyncSession = Depends(get_db)) -> UserRegisterResponse:
    # try:
    return await register_user(new_user, db)
    # except Exception:
    #     raise HTTPException(status_code=401, detail="Email already exists")