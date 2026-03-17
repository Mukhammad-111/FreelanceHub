from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewCreate(BaseModel):
    reviewed_user_id: int
    rating: int
    comment: str


class ReviewResponse(BaseModel):
    id: int
    reviewed_user_id: int
    rating: int
    comment: str
    created_at: datetime


class ReviewsList(BaseModel):
    id: int
    reviewed_user_id: int
    rating: int
    comment: str

    model_config = ConfigDict(from_attributes=True)