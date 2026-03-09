from pydantic import BaseModel


class UsersMeResponse(BaseModel):
    id: int
    email: str
    role: str
    profile: dict


class UsersMePut(BaseModel):
    name: str
    bio: str
    skills: str


class UsersMePutResponse(BaseModel):
    message: str