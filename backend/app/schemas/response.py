from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.response import ResponseStatus


class ResponseCreate(BaseModel):
    order_id: int
    message: str


class ResponseResponse(BaseModel):
    id: int
    order_id: int
    freelancer_id: int
    message: str
    status: ResponseStatus
    created_at: datetime


class MessageResponse(BaseModel):
    message: str


class ResponseList(BaseModel):
    id: int
    order_id: int
    freelancer_id: int
    status: ResponseStatus

    model_config = ConfigDict(from_attributes=True)


