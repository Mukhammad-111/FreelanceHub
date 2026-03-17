from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User
from app.schemas.review import ReviewResponse, ReviewCreate, ReviewsList
from app.services.review_service import review_create, review_get_by_user_id

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse)
async def create_review(data: ReviewCreate,
                        current_user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    return await review_create(data, current_user, db)


@router.get("/user/{user_id}", response_model=list[ReviewsList])
async def get_reviews_by_user_id(user_id: int,
                                 limit: int = 10,
                                 offset: int = 0,
                                 db: AsyncSession = Depends(get_db)):
    return await review_get_by_user_id(user_id, limit, offset, db)
