from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.profile import Profile
from app.schemas.profile import UsersMePut


async def get_profile(current_user: User, db: AsyncSession):
    profile_obj = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    user_obj = await db.execute(select(User).where(User.id == current_user.id))
    user = user_obj.scalar_one_or_none()
    profile = profile_obj.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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


async def put_profile(data: UsersMePut,
                      current_user:User,
                      db: AsyncSession):
    profile = await db.get(Profile, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.name = data.name
    profile.bio = data.bio
    profile.skills = data.skills
    await db.commit()
    return {"message": "Profile updated successfully"}