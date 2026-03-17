import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    title: str
    description: str
    budget: float
    category_id: int


class OrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    category_id: Optional[int] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    title: str
    budget: float
    status: OrderStatus
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    description: str
    client_id: int
    category_id: int
    updated_at: datetime.datetime