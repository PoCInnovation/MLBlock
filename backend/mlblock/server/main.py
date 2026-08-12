import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Charger l'env AVANT les imports internes : auth.py lit SUPABASE_JWKS_URL /
# SUPABASE_JWT_SECRET au module-level — un load_dotenv dans le lifespan
# arriverait trop tard et le serveur local ne pourrait authentifier personne.
load_dotenv()

app = FastAPI(title="MLBlock Server")

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

from mlblock.server.routes import catalog_router, samples_router, pipelines_router, validation_router, jobs_router, files_router, health_router

app.include_router(catalog_router)
app.include_router(samples_router)
app.include_router(pipelines_router)
app.include_router(validation_router)
app.include_router(jobs_router)
app.include_router(files_router)
app.include_router(health_router)
