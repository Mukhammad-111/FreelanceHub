from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.base import init_db
from app.api.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI()

app.include_router(auth_router)