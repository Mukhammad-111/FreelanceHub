from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.response import Response, ResponseStatus
from app.models.order import OrderStatus
from app.models.user import User
from app.repositories.response_repository import ResponseRepository
from app.schemas.response import ResponseCreate


async def response_create(data: ResponseCreate,
                          current_user: User,
                          db: AsyncSession):
    result = await db.execute(select(Order).where(Order.id == data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order with id:'{data.order_id}' not found")

    new_response = Response(
        order_id=data.order_id,
        freelancer_id=current_user.id,
        message=data.message
    )

    created_response = await ResponseRepository.create(new_response, db)
    await db.commit()
    await db.refresh(created_response)
    return created_response


async def response_accept(response_id: int, db: AsyncSession):
    response = await ResponseRepository.get_by_id(response_id, db)
    if not response:
        raise HTTPException(status_code=404, detail=f"Response with id:'{response_id}' not found")
    response.status = ResponseStatus.accepted
    response.order.status = OrderStatus.IN_PROGRESS
    await db.commit()
    return response


async def response_reject(response_id: int, db: AsyncSession):
    response = await ResponseRepository.get_by_id(response_id, db)
    if not response:
        raise HTTPException(status_code=404, detail=f"Response with id:'{response_id}' not found")
    response.status = ResponseStatus.rejected
    await db.commit()
    return response


async def response_get_all(order_id: int | None,
                           limit: int,
                           offset: int,
                           db: AsyncSession):
    if order_id:
        return await ResponseRepository.get_by_order_id(order_id=order_id, limit=limit, offset=offset, db=db)

    return await ResponseRepository.get_all(limit=limit, offset=offset, db=db)


async def response_get_one(response_id: int, db: AsyncSession):
    response = await ResponseRepository.get_by_id(response_id, db)
    if response is None:
        raise HTTPException(status_code=404, detail=f"Response with id:'{response_id}' not found")
    return response
