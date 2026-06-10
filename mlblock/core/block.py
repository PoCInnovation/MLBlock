from __future__ import annotations

from typing import Any, Callable

import torch.nn as nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec


class BlockMeta:
    def __init__(
        self,
        name: str,
        spec: BlockSpec,
        build_fn: Callable[[dict[str, Any]], nn.Module] | None = None,
    ) -> None:
        self.name = name
        self.spec = spec
        self._build_fn = build_fn

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

    def build_layer(self, params: dict[str, Any]) -> nn.Module:
        if self._build_fn is not None:
            return self._build_fn(params)
        raise NotImplementedError(
            f"Block '{self.name}' n'a pas de builder enregistré"
        )

    def can_build(self) -> bool:
        return self._build_fn is not None


class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}

    @classmethod
    def register(
        cls,
        name: str,
        spec: BlockSpec,
        build_fn: Callable[[dict[str, Any]], nn.Module] | None = None,
    ) -> None:
        cls._blocks[name] = BlockMeta(name, spec, build_fn)

    @classmethod
    def register_builder(
        cls,
        name: str,
        build_fn: Callable[[dict[str, Any]], nn.Module],
    ) -> None:
        if name in cls._blocks:
            cls._blocks[name]._build_fn = build_fn

    @classmethod
    def get(cls, name: str) -> BlockMeta | None:
        return cls._blocks.get(name)

    @classmethod
    def list(cls) -> list[str]:
        return list(cls._blocks.keys())

    @classmethod
    def by_category(cls, category: str) -> list[BlockMeta]:
        return [b for b in cls._blocks.values() if b.spec.category == category]
