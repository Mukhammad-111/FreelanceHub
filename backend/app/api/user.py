from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.profile import ProfileResponse
from app.services.user import users_id_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{id}", response_model=ProfileResponse)
async def get_users_id(id: int,
                       db: AsyncSession = Depends(get_db)):
    return await users_id_service(id, db)