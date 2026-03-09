from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatusUpdate, OrderResponse
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])

STATUS_TRANSITIONS = {
    OrderStatus.OPEN: [OrderStatus.IN_PROGRESS],
    OrderStatus.IN_PROGRESS: [OrderStatus.COMPLETED],
    OrderStatus.COMPLETED: [OrderStatus.PAID],
}

@router.post("/", response_model=OrderResponse)
def create_order(data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can create orders")
    order = Order(**data.dict(), client_id=current_user.id, status=OrderStatus.OPEN)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    category_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if category_id:
        query = query.filter(Order.category_id == category_id)
    if status:
        query = query.filter(Order.status == status)
    return query.offset((page - 1) * limit).limit(limit).all()

@router.get("/{id}", response_model=OrderResponse)
def get_order(id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{id}", response_model=OrderResponse)
def update_order(id: int, data: OrderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order

@router.delete("/{id}")
def delete_order(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    db.delete(order)
    db.commit()
    return {"detail": "Order deleted"}

@router.patch("/{id}/status", response_model=OrderResponse)
def change_status(id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    allowed = STATUS_TRANSITIONS.get(order.status, [])
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot change status from {order.status} to {data.status}")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order


