from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.response import ResponseStatus


class ResponseCreate(BaseModel):
    order_id: int
    message: str


class MessageResponse(BaseModel):
    message: str


class ResponseList(BaseModel):
    id: int
    order_id: int
    freelancer_id: int
    message: str
    status: ResponseStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResponsesList(BaseModel):
    limit: int
    offset: int
    items: list[ResponseList]

    model_config = ConfigDict(from_attributes=True)


