from pydantic import BaseModel
from typing import Any


class ParamSpec(BaseModel):
    type: str
    required: bool = False
    default: Any = None


class PortSpec(BaseModel):
    name: str
    dtype: str


class BlockSpec(BaseModel):
    label: str
    category: str
    params: dict[str, ParamSpec]
    inputs: list[PortSpec]
    outputs: list[PortSpec]
    template: str
    generates_class: str | None = None
    class_base: str | None = None
