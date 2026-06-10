from datetime import datetime, timezone

from sqlmodel import Column, Field, JSON, SQLModel


class Pipeline(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    nodes: list[dict] = Field(default=[], sa_column=Column(JSON))
    edges: list[dict] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
