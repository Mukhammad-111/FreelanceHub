from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat
from app.repositories.base_repository import BaseRepository


class ChatRepository(BaseRepository):
    model = Chat

    @classmethod
    async def find_private_chat(cls,
                                client_id: int,
                                freelancer_id: int,
                                db: AsyncSession):
        result = await db.execute(
            select(cls.model).where(
                cls.model.client_id == client_id,
                cls.model.freelancer_id == freelancer_id,
                cls.model.orders_id.is_(None)
            )
        )
        return result.scalar_one_or_none()