import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8)
    role: str


class UserRegisterResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime.datetime


class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8)


class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str