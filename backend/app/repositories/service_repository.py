from app.models.service import Service
from app.repositories.base_repository import BaseRepository


class ServiceRepository(BaseRepository):
    model = Service