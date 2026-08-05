import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Column, Field, ForeignKeyConstraint, JSON, Relationship, SQLModel

if TYPE_CHECKING:
    from mlblock.server.models import Job, JobOutput, Pipeline


class Profile(SQLModel, table=True):
    """Supabase-managed auth profile. Backend reads user_id from JWT, does not create rows."""
    __tablename__ = "profiles"

    id: uuid.UUID = Field(primary_key=True)
    display_name: str = ""
    avatar_url: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Pipeline(SQLModel, table=True):
    __tablename__ = "pipelines"
    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["profiles.id"]),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    name: str = Field(index=True)
    description: str = ""
    nodes: list[dict] = Field(default=[], sa_column=Column(JSON))
    edges: list[dict] = Field(default=[], sa_column=Column(JSON))
    code: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    jobs: list["Job"] = Relationship(back_populates="pipeline")


class Job(SQLModel, table=True):
    __tablename__ = "jobs"
    __table_args__ = (
        ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="CASCADE"),
        ForeignKeyConstraint(["user_id"], ["profiles.id"]),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True)
    pipeline_id: uuid.UUID = Field(index=True)
    status: str = Field(default="queued", index=True)
    vast_instance_id: str = ""
    # DEPRECATED: output is always empty string. Actual outputs live in JobOutput.
    # Kept for backward compatibility with API consumers. Remove after migration.
    output: str = ""
    error: str = ""
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    pipeline: "Pipeline" = Relationship(back_populates="jobs")
    outputs: list["JobOutput"] = Relationship(back_populates="job")


class JobOutput(SQLModel, table=True):
    __tablename__ = "job_outputs"
    __table_args__ = (
        ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: uuid.UUID = Field(index=True)
    block_name: str
    output: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    job: "Job" = Relationship(back_populates="outputs")
