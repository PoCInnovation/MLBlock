from __future__ import annotations

import math
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

from mlblock.models.pipeline import PipelineEdge, PipelineNode

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int

    def __init__(self, **data):
        if "pages" not in data:
            size = data.get("size", 1)
            total = data.get("total", 0)
            data["pages"] = math.ceil(total / size) if size > 0 else 0
        super().__init__(**data)


class BlockSummary(BaseModel):
    type: str
    label: str
    category: str
    inputs: int
    outputs: int
    can_build: bool


class BlockDetail(BaseModel):
    type: str
    label: str
    category: str
    params: dict
    inputs: list[dict]
    outputs: list[dict]
    template: str
    children_allowed: bool
    can_build: bool
    generates_class: str | None = None
    class_base: str | None = None


class PipelineSummary(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    node_count: int


class PipelineDetail(PipelineSummary):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]


class PipelineCreate(BaseModel):
    name: str
    description: str = ""
    nodes: list[PipelineNode] = []
    edges: list[PipelineEdge] = []


class PipelineUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[PipelineNode] | None = None
    edges: list[PipelineEdge] | None = None


class ValidationRequest(BaseModel):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]


class ValidationResponse(BaseModel):
    valid: bool
    errors: list[str]


class GenerateResponse(BaseModel):
    code: str


class BuildResponse(BaseModel):
    success: bool
    output_shape: list[int] | None = None
    output_values: list[list[float]] | None = None
    layer_count: int = 0
    error: str | None = None
