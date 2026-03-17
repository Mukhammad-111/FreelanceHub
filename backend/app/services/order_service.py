from typing import Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.user import Role
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate, OrderUpdate


STATUS_TRANSITIONS = {
    OrderStatus.OPEN: [OrderStatus.IN_PROGRESS],
    OrderStatus.IN_PROGRESS: [OrderStatus.COMPLETED],
    OrderStatus.COMPLETED: [OrderStatus.PAID],
}


async def create_order(data: OrderCreate, client_id: int, role: Role, db: AsyncSession) -> Order:
    if role != Role.client:
        raise HTTPException(status_code=403, detail="Only clients can create orders")
    order = Order(**data.model_dump(), client_id=client_id, status=OrderStatus.OPEN)
    try:
        await OrderRepository.create(order, db)
        await db.commit()
        await db.refresh(order)
        return order
    except Exception:
        await db.rollback()
        raise


async def get_orders(db: AsyncSession, page: int, limit: int, category_id: Optional[int], status: Optional[OrderStatus]):
    return await OrderRepository.get_all(db, page, limit, category_id, status)


async def get_order(order_id: int, db: AsyncSession) -> Order:
    order = await OrderRepository.get_by_id(order_id, db)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def update_order(order_id: int, data: OrderUpdate, client_id: int, db: AsyncSession) -> Order:
    order = await get_order(order_id, db)
    if order.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not your order")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(order, key, value)
    await db.commit()
    await db.refresh(order)
    return order


async def delete_order(order_id: int, client_id: int, db: AsyncSession) -> None:
    order = await get_order(order_id, db)
    if order.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not your order")
    await OrderRepository.delete(order, db)
    await db.commit()


async def change_status(order_id: int, new_status: OrderStatus, db: AsyncSession) -> Order:
    order = await get_order(order_id, db)
    allowed = STATUS_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {order.status.value} to {new_status.value}"
        )
    order.status = new_status
    await db.commit()
    await db.refresh(order)
    return order