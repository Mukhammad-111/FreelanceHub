from app.repositories.service_repository import ServiceRepository
from app.schemas.service import ServiceCreate, ServiceUpdate
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service

from app.models.user import User

from app.models.category import Category


async def add_service(data_service: ServiceCreate,
                      current_user: User,
                      db: AsyncSession):
    result = await db.execute(select(Category).where(Category.id == data_service.category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category is not found")

    new_service = Service(
        title=data_service.title,
        price=data_service.price,
        description=data_service.description,
        freelancer_id=current_user.id,
        category_id=data_service.category_id,
    )
    created_service = await ServiceRepository.create(new_service, db)
    await db.commit()
    await db.refresh(created_service)
    return created_service

async def get_all_services(limit: int, offset: int, db: AsyncSession):
    return await ServiceRepository.get_all(limit=limit, offset=offset, db=db)


async def get_one_service(service_id: int, db: AsyncSession):
    service = await ServiceRepository.get_by_id(service_id, db)
    if not service:
        raise HTTPException(status_code=404, detail=f"Service with id: '{service_id}' not found")
    return service


async def put_service(service_id: int,
                      data: ServiceUpdate,
                      current_user: User,
                      db: AsyncSession):
    service = await ServiceRepository.get_by_id(service_id, db)
    if not service:
        raise HTTPException(status_code=404, detail=f"Service with id: '{service_id}' not found")

    if service.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this service")

    if service.category_id != data.category_id:
        raise HTTPException(status_code=404, detail="Category not found")

    await ServiceRepository.update(service, data, db)
    await db.commit()
    return service


async def delete_service(service_id: int,
                         current_user: User,
                         db: AsyncSession):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail=f"Service with id: '{service_id}' not found")

    if service.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this service")

    await ServiceRepository.delete(service, db)
    await db.commit()
    return {"message": "Service deleted successfully"}
