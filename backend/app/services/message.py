from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories.chat import ChatRepository
from app.repositories.message import MessageRepository
from app.schemas.message import MessageCrete


async def send_message_service(data: MessageCrete, current_user, db: AsyncSession):
    chat = await ChatRepository.get_by_id(data.chat_id, db)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if current_user.id not in [chat.client_id, chat.freelancer_id]:
        raise HTTPException(status_code=403, detail="No access to this chat")

    message = Message(
        chat_id=data.chat_id,
        sender_id=current_user.id,
        text=data.text
    )
    created_message = await MessageRepository.create(message, db)
    await db.commit()
    await db.refresh(created_message)
    return created_message