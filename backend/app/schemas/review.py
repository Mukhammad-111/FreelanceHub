from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    reviewed_user_id: int
    rating: int = Field(ge=1, le=5)
    comment: str


class ReviewsList(BaseModel):
    id: int
    reviewed_user_id: int
    rating: int
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewList(BaseModel):
    limit: int
    offset: int
    items: list[ReviewsList]

    model_config = ConfigDict(from_attributes=True)