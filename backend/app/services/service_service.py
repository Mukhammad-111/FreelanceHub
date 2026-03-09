from app.repositories.service_repository import ServiceRepository
from app.schemas.service import ServiceCreate, ServiceUpdate
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service

from app.models.user import User

from app.models.category import Category


async def add_service(data_service: ServiceCreate, db: AsyncSession):
    result = await db.execute(select(Service).where(Service.title == data_service.title))
    existing_service = result.scalar_one_or_none()
    if existing_service:
        raise HTTPException(status_code=409, detail="Service already exists")

    existing_freelancer = await db.execute(select(User).where(User.id == data_service.freelancer_id))
    freelancer = existing_freelancer.scalar_one_or_none()
    if not freelancer:
        raise HTTPException(status_code=404,
                            detail=f"Freelancer with id {data_service.freelancer_id} not found")

    existing_category = await db.execute(select(Category).
                                         where(Category.id == data_service.category_id))
    category = existing_category.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404,
                            detail=f"Category with id {data_service.category_id} not found")

    new_service = Service(
        title=data_service.title,
        description=data_service.description,
        price=data_service.price,
        freelancer_id=data_service.freelancer_id,
        category_id=data_service.category_id,
    )
    created_service = await ServiceRepository.create(new_service, db)
    await db.commit()
    await db.refresh(created_service)
    return {"id": created_service.id,
            "title": created_service.title}

async def get_all_services(db: AsyncSession):
    return await ServiceRepository.get_all(db)


async def get_one_service(service_id: int, db: AsyncSession):
    service = await ServiceRepository.get_by_id(service_id, db)
    return {"id": service.id,
            "title": service.title,
            "price": service.price,
            "freelancer_id": service.freelancer_id,
            "category_id": service.category_id}


async def put_service(service_id: int,
                      data: ServiceUpdate,
                      db: AsyncSession):
    await ServiceRepository.update(service_id, data, db)
    return {"message": "Service updated successfully"}


async def delete_service(service_id, db: AsyncSession):
    await ServiceRepository.delete(service_id, db)
    return {"message": "Service deleted successfully"}
