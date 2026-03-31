import datetime
from pydantic import BaseModel, ConfigDict
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


class OrderItems(BaseModel):
    id: int
    title: str
    budget: float
    status: OrderStatus
    category_id: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    page: int
    limit: int
    items: list[OrderItems]

    model_config = {"from_attributes": True}


class OrderOne(BaseModel):
    id: int
    title: str
    description: str
    budget: float
    status: OrderStatus
    category_id: int
    client_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(BaseModel):
    title: str
    description: str
    budget: float
    status: OrderStatus
    client_id: int
    category_id: int
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class OrderDeleteResponse(BaseModel):
    message: str
