from __future__ import annotations
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, computed_field
from uuid import UUID
from datetime import datetime

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
    outputs: list[dict[str, str]] = []
    deps: list[str] = []

    def get(self, key: str, default: Any = None) -> Any:
        if key == "inputs":
            return [{"name": "in", "dtype": "torch.Tensor"}]
        if key == "outputs":
            return self.outputs
        if key == "params":
            return {k: {"type": v.type, "default": v.default, "required": v.required} for k, v in self.params.items()}
        if key == "template":
            return "{output.out} = nn.SomeLayer({params.in_channels})"
        if key == "category":
            return self.category.name
        if key == "label":
            return self.name.replace("_", " ").title()
        if hasattr(self, key):
            return getattr(self, key)
        return default

    def __getitem__(self, key: str) -> Any:
        val = self.get(key)
        if val is None:
            raise KeyError(key)
        return val

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

    @computed_field
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
