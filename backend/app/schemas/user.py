import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.user import Role

class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8)


class UserRegister(UserLogin):
    role: Role


class UserMeResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class UserRegisterResponse(UserMeResponse):
    is_active: bool
    created_at: datetime.datetime


class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class UserRefresh(BaseModel):
    refresh_token: str


class UserRefreshResponse(BaseModel):
    access_token: str
    token_type: str


class UserLogoutResponse(BaseModel):
    message: str
