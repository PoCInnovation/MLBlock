import uuid
from datetime import datetime, timezone
from sqlmodel import Column, Field, JSON, SQLModel


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: uuid.UUID = Field(primary_key=True)
    display_name: str = ""
    avatar_url: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Pipeline(SQLModel, table=True):
    __tablename__ = "pipelines"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    name: str = Field(index=True)
    description: str = ""
    nodes: list[dict] = Field(default=[], sa_column=Column(JSON))
    edges: list[dict] = Field(default=[], sa_column=Column(JSON))
    code: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    pipeline_id: uuid.UUID = Field(index=True)
    status: str = Field(default="queued", index=True)
    vast_instance_id: str = ""
    output: str = ""
    error: str = ""
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class JobOutput(SQLModel, table=True):
    __tablename__ = "job_outputs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: uuid.UUID = Field(index=True)
    block_name: str
    output: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
