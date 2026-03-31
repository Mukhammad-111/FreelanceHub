from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.service_repository import ServiceRepository
from app.repositories.payment_repository import PaymentRepository


async def admin_stats(db: AsyncSession):
    total_users = await UserRepository.total_users(db)
    total_orders = await OrderRepository.total_orders(db)
    total_services = await ServiceRepository.total_services(db)
    total_payments = await PaymentRepository.total_payments(db)
    return {"users_total": total_users,
            "orders_total": total_orders,
            "services_total": total_services,
            "payments_total": total_payments}