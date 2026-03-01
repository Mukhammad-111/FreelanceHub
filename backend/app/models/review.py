import datetime

from sqlalchemy import ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Review(Base):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),
                                             index=True)
    reviewed_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),
                                                  index=True)
    rating: Mapped[int] = mapped_column(ge=1, le=5, nullable=False)
    comment: Mapped[Text] = mapped_column(Text())
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())