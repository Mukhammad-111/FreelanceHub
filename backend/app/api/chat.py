from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models import User, Chat
from app.models.message import Message
from app.repositories.chat import ChatRepository
from app.services.chat import start_chat_service

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("/{chat_id}/messages")
async def get_messages(chat_id: int,
                       limit: int = 20,
                       offset: int = 0,
                       current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    chat = await ChatRepository.get_by_id(chat_id, db)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if current_user.id not in [chat.client_id, chat.freelancer_id]:
        raise HTTPException(status_code=403, detail="No access")

    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    messages = result.scalars().all()
    return messages


@router.get("/my_chats")
async def get_my_chats(current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Chat)
        .where(
            (Chat.client_id == current_user.id) |
            (Chat.freelancer_id == current_user.id)
        )
        .order_by(Chat.created_at.desc())
    )
    return result.scalars().all()


@router.post("/start")
async def start_chat(freelancer_id: int,
                     current_user: User = Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):
    return await start_chat_service(freelancer_id, current_user, db)