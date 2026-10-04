from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import config
from app.db import init_db
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PM App", lifespan=lifespan)
app.include_router(router)

if config.STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="static")
