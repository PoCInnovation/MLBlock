from __future__ import annotations

from typing import Any

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec


class BlockMeta:
    def __init__(
        self,
        name: str,
        spec: BlockSpec,
    ) -> None:
        self.name = name
        self.spec = spec

    @property
    def label(self) -> str:
        return self.spec.label

    @property
    def category(self) -> str:
        return self.spec.category

    @property
    def params(self) -> dict[str, ParamSpec]:
        return self.spec.params

    @property
    def inputs(self) -> list[PortSpec]:
        return self.spec.inputs

    @property
    def outputs(self) -> list[PortSpec]:
        return self.spec.outputs

    @property
    def template(self) -> str:
        return self.spec.template


class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}

    @classmethod
    def register(
        cls,
        name: str,
        spec: BlockSpec,
    ) -> None:
        cls._blocks[name] = BlockMeta(name, spec)

    @classmethod
    def get(cls, name: str) -> BlockMeta | None:
        return cls._blocks.get(name)

    @classmethod
    def list(cls) -> list[str]:
        return list(cls._blocks.keys())

    @classmethod
    def by_category(cls, category: str) -> list[BlockMeta]:
        return [b for b in cls._blocks.values() if b.spec.category == category]
