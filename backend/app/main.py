from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.base import init_db
from app.api.auth import router as auth_router
from app.api.profiles import router as profiles_router
from app.api.services import router as services_router
from app.api.categories import router as categories_router
from app.api.responses import router as responses_router
from app.api.reviews import router as reviews_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="FreelanceHub API",
              lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(orders_router)
app.include_router(services_router)
app.include_router(categories_router)
app.include_router(responses_router)
app.include_router(reviews_router)
app.include_router(payments_router)
app.include_router(admin_router)
