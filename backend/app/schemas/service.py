from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    title: str
    description: str
    price: float
    freelancer_id: int = Field(ge=1)
    category_id: int = Field(ge=1)


class ServiceUpdate(ServiceCreate):
    pass


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



