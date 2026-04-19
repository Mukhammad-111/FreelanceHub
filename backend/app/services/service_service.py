from app.repositories.service_repository import ServiceRepository
from app.schemas.service import ServiceCreate, ServiceUpdate
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service

from app.models.user import User

from app.models.category import Category
from app.models.profile import Profile


async def _attach_freelancer_names(services: list[Service], db: AsyncSession):
    freelancer_ids = [service.freelancer_id for service in services if service.freelancer_id]
    if not freelancer_ids:
        return services

    profiles_result = await db.execute(
        select(Profile.user_id, Profile.name).where(Profile.user_id.in_(freelancer_ids))
    )
    profile_name_map = {user_id: name for user_id, name in profiles_result.all()}
    users_result = await db.execute(
        select(User.id, User.email).where(User.id.in_(freelancer_ids))
    )
    email_map = {user_id: email for user_id, email in users_result.all()}

    for service in services:
        display_name = profile_name_map.get(service.freelancer_id) or email_map.get(service.freelancer_id)
        setattr(service, "freelancer_name", display_name)
        if service.freelancer is not None:
            service.freelancer.name = profile_name_map.get(service.freelancer_id)
            service.freelancer.email = email_map.get(service.freelancer_id)
    return services


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

async def get_all_services(limit: int, offset: int, db: AsyncSession, category_id: int | None = None):
    services = await ServiceRepository.get_all_filtered(
        limit=limit,
        offset=offset,
        db=db,
        category_id=category_id,
    )
    return await _attach_freelancer_names(services, db)


async def get_one_service(service_id: int, db: AsyncSession):
    service = await ServiceRepository.get_by_id(service_id, db)
    if not service:
        raise HTTPException(status_code=404, detail=f"Service with id: '{service_id}' not found")
    await _attach_freelancer_names([service], db)
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
