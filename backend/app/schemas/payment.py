import datetime

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    order_id: int
    amount: float


class PaymentResponseList(BaseModel):
    id: int
    order_id: int
    amount: float
    status: PaymentStatus
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentList(BaseModel):
    limit: int
    offset: int
    items: list[PaymentResponseList]

    model_config = ConfigDict(from_attributes=True)