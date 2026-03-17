from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.base import init_db
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.services import router as services_router
from app.api.categories import router as categories_router
from app.api.responses import router as responses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="FreelanceHub API",
              lifespan=lifespan)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(services_router)
app.include_router(categories_router)
app.include_router(responses_router)