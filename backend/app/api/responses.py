from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.response import ResponseCreate, MessageResponse, ResponseList, ResponsesList
from app.services.response_service import (response_create, response_accept,
                                           response_reject, response_get_all, response_get_one)

router = APIRouter(prefix="/responses", tags=["Responses"])


@router.post("/", response_model=ResponseList)
async def create_response(data: ResponseCreate,
                          current: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    if current.role != Role.freelancer:
        raise HTTPException(status_code=403, detail="Only freelancer can create")
    return await response_create(data, current, db)


@router.post("/{response_id}/accept", response_model=MessageResponse)
async def accept_response(response_id: int,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    await response_accept(response_id, current_user, db)
    return {"message": "Response accepted"}


@router.post("/{response_id}/reject", response_model=MessageResponse)
async def reject_response(response_id: int,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    await response_reject(response_id, current_user, db)
    return {"message": "Response rejected"}


@router.get("/", response_model=ResponsesList)
async def get_all_response(order_id: int | None = Query(None, ge=1),
                  limit: int = Query(10, ge=1, le=10),
                  offset: int = Query(0, ge=0, le=100),
                  db: AsyncSession = Depends(get_db)):
    responses = await response_get_all(order_id, limit, offset, db)
    return {"limit": limit,
            "offset": offset,
            "items": responses}


@router.get("/{response_id}", response_model=ResponseList)
async def get_one_response(response_id: int, db: AsyncSession = Depends(get_db)):
    return await response_get_one(response_id, db)