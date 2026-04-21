from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat
from app.models.message import Message
from app.models.response import Response, ResponseStatus
from app.models.order import OrderStatus
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.repositories.message import MessageRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.response_repository import ResponseRepository
from app.schemas.response import ResponseCreate


async def response_create(data: ResponseCreate,
                          current_user: User,
                          db: AsyncSession):
    order = await OrderRepository.get_by_id(data.order_id, db)
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


async def response_accept(response_id: int, current_user: User, db: AsyncSession):
    response = await ResponseRepository.get_by_id_with_order(response_id, db)
    if not response:
        raise HTTPException(status_code=404, detail=f"Response with id:'{response_id}' not found")

    if response.order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner of the order can accept")

    response.status = ResponseStatus.accepted
    response.order.status = OrderStatus.IN_PROGRESS

    chat = Chat(
        client_id=response.order.client_id,
        freelancer_id=response.freelancer_id,
        orders_id=response.order_id
    )
    await ChatRepository.create(chat, db)
    await db.flush()
    await db.refresh(chat)

    if current_user.id not in [chat.client_id, chat.freelancer_id]:
        raise HTTPException(status_code=403, detail="No access")

    await db.commit()
    return response


async def response_reject(response_id: int, current_user: User, db: AsyncSession):
    response = await ResponseRepository.get_by_id_with_order(response_id, db)
    if not response:
        raise HTTPException(status_code=404, detail=f"Response with id:'{response_id}' not found")

    if response.order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner of the order can reject")

    response.status = ResponseStatus.rejected
    response.order.status = OrderStatus.OPEN
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
