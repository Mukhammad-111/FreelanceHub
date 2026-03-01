import datetime

from sqlalchemy import ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class Status(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    message: Mapped[Text] = mapped_column(Text())
    status: Mapped[Status] = mapped_column(default=Status.pending)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())