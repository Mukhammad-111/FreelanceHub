from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Chat
from app.models.user import Role
from app.repositories.chat import ChatRepository


async def start_chat_service(freelancer_id: int,
                             current_user,
                             db: AsyncSession):
    if current_user.role != Role.client:
        raise HTTPException(status_code=403, detail="Only client can")

    if current_user.id == freelancer_id:
        raise HTTPException(status_code=400, detail="You cant chat with yourself")

    existing_chat = await ChatRepository.find_private_chat(
        client_id=current_user.id,
        freelancer_id=freelancer_id,
        db=db
    )
    if existing_chat:
        return existing_chat

    chat = Chat(
        client_id=current_user.id,
        freelancer_id=freelancer_id,
        orders_id=None
    )
    created_chat = await ChatRepository.create(chat, db)

    await db.commit()
    await db.refresh(created_chat)
    return created_chat