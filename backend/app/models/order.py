import datetime

from sqlalchemy import ForeignKey, func, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base import Base


class Status(enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PAID = "PAID"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Text] = mapped_column(Text())
    budget: Mapped[float] = mapped_column(nullable=False)
    status: Mapped[Status] = mapped_column(Enum(Status), default=Status.OPEN)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(),
                                                          onupdate=datetime.datetime.utcnow)