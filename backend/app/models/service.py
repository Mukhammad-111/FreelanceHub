import datetime

from sqlalchemy import ForeignKey, func, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Text] = mapped_column(Text())
    price: Mapped[float] = mapped_column(nullable=False)
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),
                                               index=True)
    freelancer: Mapped["User"] = relationship("User", lazy="joined")
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(),
                                                           onupdate=func.now())