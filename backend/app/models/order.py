import datetime
import enum

from sqlalchemy import ForeignKey, String, Text, Enum, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Status(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PAID = "PAID"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    budget: Mapped[float] = mapped_column(nullable=False)
    status: Mapped[Status] = mapped_column (default=Status.OPEN, nullable=False)

    client_id = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped["User"] = relationship("User", lazy="selectin")
    category: Mapped["Category"] = relationship("Category", lazy="selectin")