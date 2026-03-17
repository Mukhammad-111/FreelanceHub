import datetime

from sqlalchemy import ForeignKey, func, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class PaymentStatus(enum.Enum):
    pending = "pending"
    paid = "paid"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    amount: Mapped[float]
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())