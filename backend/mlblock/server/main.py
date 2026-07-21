from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mlblock.server.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv()
    init_db()
    yield


app = FastAPI(title="MLBlock Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from mlblock.server.routes import blocks_router, pipelines_router, validation_router, jobs_router

app.include_router(blocks_router)
app.include_router(pipelines_router)
app.include_router(validation_router)
app.include_router(jobs_router)
