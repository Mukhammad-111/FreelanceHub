from fastapi import APIRouter, Depends

from app.schemas.service import (ServiceCreate, ServiceResponse, ServiceIdResponse,
                                 ServiceUpdate, ServiceUpdateResponse, ServiceDeleteResponse)
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

from app.services.service_service import (add_service, get_all_services, get_one_service,
                                          put_service, delete_service)

router = APIRouter(prefix="/services", tags=["Services"])


@router.post("/")
async def create_service(data: ServiceCreate,
                         db: AsyncSession = Depends(get_db)) -> ServiceResponse:
    return await add_service(data, db)


@router.get("/", response_model=list[ServiceResponse])
async def get_all(db: AsyncSession = Depends(get_db)):
    return await get_all_services(db)


@router.get("/{service_id}")
async def get_service(service_id: int,
                      db: AsyncSession = Depends(get_db)) -> ServiceIdResponse:
    return await get_one_service(service_id, db)


@router.put("/{service_id}")
async def update_service(service_id: int,
                         data: ServiceUpdate,
                         db: AsyncSession = Depends(get_db)) -> ServiceUpdateResponse:
    return await put_service(service_id, data, db)


@router.delete("/{service_id}")
async def delete(service_id: int,
                 db: AsyncSession = Depends(get_db)) -> ServiceDeleteResponse:
    return await delete_service(service_id, db)