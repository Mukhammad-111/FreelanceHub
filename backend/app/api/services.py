from fastapi import APIRouter, Depends, Query, HTTPException

from app.dependencies.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.service import (ServiceCreate, ServiceResponse, ServiceIdResponse,
                                 ServiceUpdate, ServiceDeleteResponse, ServiceItems)
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

from app.services.service_service import (add_service, get_all_services, get_one_service,
                                          put_service, delete_service)

router = APIRouter(prefix="/services", tags=["Services"])


@router.post("/", response_model=ServiceIdResponse)
async def create_service(data: ServiceCreate,
                         current_user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)):
    if current_user.role != Role.freelancer:
        raise HTTPException(status_code=403, detail="Только исполнители могут создавать услуги")
    return await add_service(data, current_user, db)


@router.get("/", response_model=ServiceResponse)
async def get_all(limit: int = Query(10, ge=1, le=10),
                  offset: int = Query(0, ge=0, le=100),
                  db: AsyncSession = Depends(get_db),):
    services = await get_all_services(limit, offset, db)
    return {"limit": limit,
            "offset": offset,
            "items": services}


@router.get("/{service_id}", response_model=ServiceIdResponse)
async def get_service(service_id: int,
                      db: AsyncSession = Depends(get_db)):
    return await get_one_service(service_id, db)


@router.put("/{service_id}", response_model=ServiceIdResponse)
async def update_service(service_id: int,
                         data: ServiceUpdate,
                         current_user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)):
    return await put_service(service_id, data, current_user, db)


@router.delete("/{service_id}")
async def delete(service_id: int,
                 current_user: User = Depends(get_current_user),
                 db: AsyncSession = Depends(get_db)) -> ServiceDeleteResponse:
    return await delete_service(service_id, current_user, db)