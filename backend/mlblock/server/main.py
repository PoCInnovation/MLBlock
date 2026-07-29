import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv()
    yield


app = FastAPI(title="MLBlock Server", lifespan=lifespan)

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

from mlblock.server.routes import catalog_router, pipelines_router, validation_router, jobs_router

app.include_router(catalog_router)
app.include_router(pipelines_router)
app.include_router(validation_router)
app.include_router(jobs_router)
