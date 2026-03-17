from app.schemas.category import CategoryCreate, CategoryUpdate
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.category_repository import CategoryRepository
from app.models.category import Category


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


async def category_put(category_id: int, data: CategoryUpdate, db: AsyncSession):
    category = await CategoryRepository.get_by_id(category_id, db)
    if category is None:
        raise HTTPException(status_code=404,
                            detail=f"Category with id:'{category_id}' not found")
    if data.name and data.name != category.name:
        existing = await CategoryRepository.get_by_name(data.name, db)
        if existing:
            raise HTTPException(status_code=400, detail="This category name is already taken")

    await CategoryRepository.update(category, data, db)
    await db.commit()
    return {"name": data.name}


async def category_delete(category_id: int, db: AsyncSession):
    category = await CategoryRepository.get_by_id(category_id, db)
    if category is None:
        raise HTTPException(status_code=404,
                            detail=f"Category with id:'{category_id}' not found")

    await CategoryRepository.delete(category, db)
    await db.commit()
    return {"message": "Successfully deleted"}


async def get_all_categories(limit: int, offset: int, db: AsyncSession):
    return await CategoryRepository.get_all(limit=limit, offset=offset, db=db)