from fastapi import APIRouter, Depends

from app.dependencies.dependencies import get_current_user
from app.models.user import User
from app.schemas.service import (ServiceCreate, ServiceResponse, ServiceIdResponse,
                                 ServiceUpdate, ServiceUpdateResponse, ServiceDeleteResponse)
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

from app.services.service_service import (add_service, get_all_services, get_one_service,
                                          put_service, delete_service)

router = APIRouter(prefix="/services", tags=["Services"])


@router.post("/")
async def create_service(data: ServiceCreate,
                         current_user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)) -> ServiceResponse:
    return await add_service(data, current_user, db)


@router.get("/", response_model=list[ServiceResponse])
async def get_all(limit: int,
                  offset: int,
                  db: AsyncSession = Depends(get_db),):
    return await get_all_services(limit, offset, db)


@router.get("/{service_id}")
async def get_service(service_id: int,
                      db: AsyncSession = Depends(get_db)) -> ServiceIdResponse:
    return await get_one_service(service_id, db)


@router.put("/{service_id}")
async def update_service(service_id: int,
                         data: ServiceUpdate,
                         current_user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)) -> ServiceUpdateResponse:
    return await put_service(service_id, data, current_user, db)


@router.delete("/{service_id}")
async def delete(service_id: int,
                 current_user: User = Depends(get_current_user),
                 db: AsyncSession = Depends(get_db)) -> ServiceDeleteResponse:
    return await delete_service(service_id, current_user, db)