import os
from collections.abc import Generator
from sqlmodel import Session, SQLModel, create_engine

_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is required. Set it in your .env or environment."
            )
        _engine = create_engine(
            database_url,
            pool_size=20,
            max_overflow=10,
            pool_recycle=3600,
        )
    return _engine


def get_session() -> Generator[Session, None, None]:
    with Session(_get_engine()) as session:
        yield session


def init_db() -> None:
    # Explicitly import models to register them on SQLModel.metadata before creation
    from mlblock.server.models import Profile, Pipeline, Job, JobOutput
    SQLModel.metadata.create_all(_get_engine())
