import datetime

from pydantic import BaseModel, Field, ConfigDict


class ServiceCreate(BaseModel):
    title: str
    description: str
    price: float
    category_id: int = Field(ge=1)


class ServiceUpdate(ServiceCreate):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    category_id: int | None = None


class ServiceDeleteResponse(BaseModel):
    message: str

    model_config = ConfigDict(from_attributes=True)


class ServiceItems(BaseModel):
    id: int
    title: str
    price: float
    category_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceResponse(BaseModel):
    limit: int
    offset: int
    items: list[ServiceItems]

    model_config = ConfigDict(from_attributes=True)


class ServiceIdResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    freelancer_id: int
    category_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)



