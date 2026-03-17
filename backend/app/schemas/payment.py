from pydantic import BaseModel

from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    order_id: int
    amount: float


class PaymentResponse(BaseModel):
    id: int
    status: PaymentStatus


class PaymentResponseList(BaseModel):
    id: int
    order_id: int
    amount: float
    status: PaymentStatus