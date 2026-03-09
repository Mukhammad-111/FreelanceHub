from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqladmin import Admin, ModelView
from app.db.base import init_db, engine
from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.models.user import User
from app.models.order import Order
from app.models.category import Category


# --- Admin Views ---
class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.role, User.is_active, User.created_at]
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"


class OrderAdmin(ModelView, model=Order):
    column_list = [Order.id, Order.title, Order.budget, Order.status, Order.client_id, Order.created_at]
    form_columns = [Order.title, Order.description, Order.budget, Order.status, Order.client_id, Order.category_id]
    name = "Order"
    name_plural = "Orders"
    icon = "fa-solid fa-briefcase"


class CategoryAdmin(ModelView, model=Category):
    column_list = [Category.id, Category.name, Category.created_at]
    name = "Category"
    name_plural = "Categories"
    icon = "fa-solid fa-tag"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)

# --- Подключаем Admin ---
admin = Admin(app, engine)
admin.add_view(UserAdmin)
admin.add_view(OrderAdmin)
admin.add_view(CategoryAdmin)

app.include_router(auth_router)
app.include_router(orders_router)