from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository


async def users_id_service(id: int, db: AsyncSession):
    user = await UserRepository.get_by_id(id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = await ProfileRepository.get_by_user_id(user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"id": user.id,
            "email": user.email,
            "role": user.role,
            "profile": {
                "name": profile.name,
                "bio": profile.bio,
                "skills": profile.skills,
                "rating": profile.rating
            }}