from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import ProfilePut


async def get_profile(current_user: User, db: AsyncSession):
    user = await UserRepository.get_by_id(current_user.id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = await ProfileRepository.get_by_user_id(current_user.id, db)
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


async def put_profile(data: ProfilePut,
                      current_user:User,
                      db: AsyncSession):
    user = await UserRepository.get_by_id(current_user.id, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    profile = await ProfileRepository.get_by_id(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    await ProfileRepository.update(profile, data, db)
    await db.commit()
    return {"id": user.id,
            "email": user.email,
            "role": user.role,
            "profile": {
                "name": profile.name,
                "bio": profile.bio,
                "skills": profile.skills,
                "rating": profile.rating
            }}