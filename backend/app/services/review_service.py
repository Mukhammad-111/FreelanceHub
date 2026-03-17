from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.user import User
from app.repositories.review_repository import ReviewRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review import ReviewCreate


async def review_create(data: ReviewCreate,
                        current_user: User,
                        db: AsyncSession):
    if data.reviewed_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot leave a review for yourself")

    reviewed_user = await UserRepository.get_by_id(data.reviewed_user_id, db)
    if not reviewed_user:
        raise HTTPException(status_code=404,
                            detail=f"Reviewed_user with id:'{data.reviewed_user_id}' not found")

    new_review = Review(
        reviewer_id=current_user.id,
        reviewed_user_id=data.reviewed_user_id,
        rating=data.rating,
        comment=data.comment
    )

    created_review = await ReviewRepository.create(new_review, db)
    await db.commit()
    await db.refresh(created_review)
    return created_review


async def review_get_by_user_id(
        user_id: int,
        limit: int,
        offset: int,
        db: AsyncSession,
):
    user = await UserRepository.get_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with id:'{user_id}' not found")

    review = await ReviewRepository.get_by_reviews_user_id(user_id=user_id,
                                                           limit=limit,
                                                           offset=offset,
                                                           db=db)
    return review