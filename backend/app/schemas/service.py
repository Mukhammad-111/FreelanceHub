from pydantic import BaseModel, Field


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


class ServiceUpdateResponse(BaseModel):
    message: str


class ServiceDeleteResponse(ServiceUpdateResponse):
    pass


class ServiceResponse(BaseModel):
    id: int
    title: str


class ServiceIdResponse(BaseModel):
    id: int
    title: str
    price: float
    freelancer_id: int
    category_id: int



