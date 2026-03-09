from typing import Optional, List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.order import Status
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderDetailResponse,
)

from app.services.auth_service import get_current_user

from app.services.order_service import (
    create_order,
    get_orders,
    get_order,
    update_order,
    delete_order,
    change_status,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await create_order(data, current_user.id, current_user.role, db)


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = Query(None, ge=1),
    status_: Optional[Status] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    return await get_orders(db, page, limit, category_id, status_)


@router.get("/{id}", response_model=OrderDetailResponse)
async def retrieve(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    return await get_order(id, db)


@router.put("/{id}", response_model=OrderDetailResponse)
async def update(
    id: int,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await update_order(id, data, current_user.id, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await delete_order(id, current_user.id, db)
    return None


@router.patch("/{id}/status", response_model=OrderDetailResponse)
async def update_status(
    id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await change_status(id, data.status, current_user.id, current_user.role, db)