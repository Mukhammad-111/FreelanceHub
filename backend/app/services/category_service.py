from app.schemas.category import CategoryCreate
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.category_repository import CategoryRepository
from app.models.category import Category
from app.models.user import User


async def category_create(data: CategoryCreate,
                          db: AsyncSession):
    existing = await CategoryRepository.get_by_name(data.name, db)
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists!")

    category = Category(
        name=data.name
    )
    await CategoryRepository.create(category, db)
    await db.commit()
    await db.refresh(category)
    return {"id": category.id,
            "name": category.name}


async def get_all_categories(db: AsyncSession):
    return await CategoryRepository.get_all(db)