from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.models.user import User
from app.services.category_service import category_create, get_all_categories, category_put, category_delete
from app.dependencies.dependencies import get_current_user

from app.models.user import Role

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/")
async def create_category(data: CategoryCreate,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)) -> CategoryResponse:
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin can create categories")
    return await category_create(data, db)


@router.put("/{category_id}")
async def update_category(category_id: int,
                          data: CategoryUpdate,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin can update categories")
    return await category_put(category_id, data, db)


@router.delete("/{category_id}")
async def delete_category(category_id: int,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete categories")
    return await category_delete(category_id, db)


@router.get("/", response_model=list[CategoryResponse])
async def get_all(limit: int,
                  offset: int,
                  db: AsyncSession = Depends(get_db)):
    return await get_all_categories(limit, offset, db)