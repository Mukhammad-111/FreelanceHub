from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(max_length=255)


class CategoryResponse(BaseModel):
    id: int
    name: str = Field(max_length=255)


class CategoryUpdate(BaseModel):
    name: str | None = None