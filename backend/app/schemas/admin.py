import datetime

from pydantic import BaseModel, ConfigDict


class Stats(BaseModel):
    users_total: int
    orders_total: int
    services_total: int
    payments_total: int


class Users(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    message: str