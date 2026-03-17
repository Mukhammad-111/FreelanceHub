from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User
from app.schemas.response import ResponseCreate, ResponseResponse, MessageResponse, ResponseList
from app.services.response_service import (response_create, response_accept,
                                           response_reject, response_get_all, response_get_one)

router = APIRouter(prefix="/responses", tags=["Responses"])


@router.post("/", response_model=ResponseResponse)
async def create_response(data: ResponseCreate,
                          current: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    return await response_create(data, current, db)


@router.post("/{response_id}/accept", response_model=MessageResponse)
async def accept_response(response_id: int, db: AsyncSession = Depends(get_db)):
    return await response_accept(response_id, db)


@router.post("/{response_id}/reject")
async def reject_response(response_id: int, db: AsyncSession = Depends(get_db)):
    return response_reject(response_id, db)


@router.get("/", response_model=list[ResponseList])
async def get_all_response(order_id: int | None,
                  limit: int = 10,
                  offset: int = 0,
                  db: AsyncSession = Depends(get_db)):
    return await response_get_all(order_id, limit, offset, db)


@router.get("/{response_id}", response_model=ResponseResponse)
async def get_one_response(response_id: int, db: AsyncSession = Depends(get_db)):
    return await response_get_one(response_id, db)