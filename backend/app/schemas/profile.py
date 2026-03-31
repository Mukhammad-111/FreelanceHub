from pydantic import BaseModel, ConfigDict


class ProfilePut(BaseModel):
    name: str | None
    bio: str | None
    skills: str | None

    model_config = ConfigDict(from_attributes=True)


class ProfileItems(ProfilePut):
    rating: float

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    profile: ProfileItems

    model_config = ConfigDict(from_attributes=True)