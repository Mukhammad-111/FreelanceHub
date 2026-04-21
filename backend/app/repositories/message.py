from app.models.message import Message
from app.repositories.base_repository import BaseRepository


class MessageRepository(BaseRepository):
    model = Message