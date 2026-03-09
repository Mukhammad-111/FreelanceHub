from sqlalchemy import func, String, Enum
from sqlalchemy.orm import mapped_column, Mapped
import enum
from app.db.base import Base
import datetime


class Role(enum.Enum):
    client = "client"
    freelancer = "freelancer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role),  nullable=False)
    is_active: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(),
                                                          onupdate=datetime.datetime.utcnow)