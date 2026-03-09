from fastapi import APIRouter, Depends
from app.dependencies.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User

from app.services.profile_service import get_profile

from app.schemas.profile import UsersMeResponse, UsersMePut, UsersMePutResponse

from app.services.profile_service import put_profile

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user),
             db: AsyncSession = Depends(get_db)) -> UsersMeResponse:
    return await get_profile(current_user, db)


@router.put("/me")
async def put_me(data: UsersMePut,
                 current_user: User = Depends(get_current_user),
                 db: AsyncSession = Depends(get_db)) -> UsersMePutResponse:
    return await put_profile(data, current_user, db)