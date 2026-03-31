import datetime

from pydantic import BaseModel, Field, ConfigDict


class CategoryCreate(BaseModel):
    name: str = Field(max_length=255)


class CategoryResponse(BaseModel):
    id: int
    name: str = Field(max_length=255)
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryList(BaseModel):
    limit: int
    offset: int
    items: list[CategoryResponse]

    model_config = ConfigDict(from_attributes=True)


class CategoryUpdate(BaseModel):
    name: str | None = None