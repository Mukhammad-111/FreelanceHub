import datetime

from sqlalchemy import ForeignKey, func, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base


class OrderStatus(enum.Enum):
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
    status: Mapped[OrderStatus] = mapped_column(default=OrderStatus.OPEN)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id",
                                                      ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id",
                                                        ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(),
                                                          onupdate=func.now())

    client: Mapped["User"] = relationship("User", lazy="selectin")
    category: Mapped["Category"] = relationship("Category", lazy="selectin")
    responses: Mapped[list["Response"]] = relationship(
        "Response", back_populates="order", cascade="all, delete-orphan")