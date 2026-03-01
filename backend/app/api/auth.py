from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.schemas.user import UserRegister, UserRegisterResponse

router = APIRouter(prefix="/auth")


@router.post("/register")
async def register(
        data: UserRegister,
        db: AsyncSession = Depends(get_db)) -> UserRegisterResponse:
    return {}