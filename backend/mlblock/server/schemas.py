from __future__ import annotations
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, computed_field
from uuid import UUID

from mlblock.models.pipeline import PipelineEdge, PipelineNode


class ParamInfo(BaseModel):
    type: str
    description: str = ""
    default: Any = None
    required: bool = False


class Category(BaseModel):
    name: str
    color: str


class Block(BaseModel):
    name: str
    description: str = ""
    category: Category
    params: dict[str, ParamInfo] = {}
    inputs: list[dict[str, str]] = []
    outputs: list[dict[str, str]] = []


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int = 0

    def model_post_init(self, __context: Any) -> None:
        import math
        self.pages = math.ceil(self.total / self.size) if self.size > 0 else 0


class PipelineCreate(BaseModel):
    name: str
    description: str = ""
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]


class PipelineUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[PipelineNode] | None = None
    edges: list[PipelineEdge] | None = None


class PipelineDetail(BaseModel):
    id: UUID
    name: str
    description: str
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]
    code: str
    created_at: str
    updated_at: str

    @computed_field  # type: ignore[prop-decorator]
    @property
    def node_count(self) -> int:
        return len(self.nodes)


class JobStatusUpdate(BaseModel):
    block: str
    status: str


class JobOutputPush(BaseModel):
    block: str
    output: str


class JobErrorPush(BaseModel):
    block: str
    error: str


class ValidationRequest(BaseModel):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]


class ValidationResponse(BaseModel):
    valid: bool
    errors: list[str]
