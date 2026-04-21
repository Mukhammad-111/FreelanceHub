from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.dependencies import get_current_user
from app.models import User
from app.schemas.message import MessageCrete, SendMessageResponse
from app.services.message import send_message_service

router = APIRouter(prefix="/message", tags=["Message"])


@router.post("/", response_model=SendMessageResponse)
async def send_message(data: MessageCrete,
                       current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    return await send_message_service(data, current_user, db)