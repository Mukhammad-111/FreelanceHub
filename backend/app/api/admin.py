from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.admin import Stats
from app.services.admin_service import admin_stats

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=Stats)
async def get_stats(current_user: User = Depends(get_current_user),
                    db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin")
    return await admin_stats(db)