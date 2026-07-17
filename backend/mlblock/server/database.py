import os
from collections.abc import Generator
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to SQLite for testing/development if no database URL is set
    engine = create_engine("sqlite:///mlblock.db", echo=False)
else:
    # Configuration of SQLModel engine with pooling of connections for PostgreSQL
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_recycle=3600
    )


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    # Explicitly import models to register them on SQLModel.metadata before creation
    from mlblock.server.models import Profile, Pipeline, Job, JobOutput
    SQLModel.metadata.create_all(engine)
