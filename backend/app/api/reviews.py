from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewsList, ReviewList
from app.services.review_service import review_create, review_get_by_user_id

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewsList)
async def create_review(data: ReviewCreate,
                        current_user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    return await review_create(data, current_user, db)


@router.get("/user/{user_id}", response_model=ReviewList)
async def get_reviews_by_user_id(user_id: int = Path(..., ge=1),
                                 limit: int = Query(10, ge=1, le=10),
                                 offset: int = Query(0, ge=0, le=100),
                                 db: AsyncSession = Depends(get_db)):
    reviews = await review_get_by_user_id(user_id, limit, offset, db)
    return {"limit": limit,
            "offset": offset,
            "items": reviews}
