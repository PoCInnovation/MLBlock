from __future__ import annotations

from typing import Any, Callable

import torch.nn as nn


class BlockMeta:
    def __init__(
        self,
        name: str,
        definition: dict[str, Any],
        build_fn: Callable[[dict[str, Any]], nn.Module] | None = None,
    ) -> None:
        self.name = name
        self.label: str = definition.get("label", name)
        self.category: str = definition.get("category", "default")
        self.params: dict[str, Any] = definition.get("params", {})
        self.inputs: list[dict[str, str]] = definition.get("inputs", [])
        self.outputs: list[dict[str, str]] = definition.get("outputs", [])
        self.template: str = definition.get("template", "")
        self._build_fn = build_fn

    def build_layer(self, params: dict[str, Any]) -> nn.Module:
        if self._build_fn is not None:
            return self._build_fn(params)
        raise NotImplementedError(
            f"Block '{self.name}' does not have a builder registered"
        )


class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}

    @classmethod
    def register(
        cls,
        name: str,
        definition: dict[str, Any],
        build_fn: Callable[[dict[str, Any]], nn.Module] | None = None,
    ) -> None:
        cls._blocks[name] = BlockMeta(name, definition, build_fn)

    @classmethod
    def register_batch(
        cls,
        definitions: dict[str, dict[str, Any]],
        builders: dict[str, Callable[[dict[str, Any]], nn.Module]] | None = None,
    ) -> None:
        builders = builders or {}
        for name, defn in definitions.items():
            cls.register(name, defn, builders.get(name))

    @classmethod
    def get(cls, name: str) -> BlockMeta | None:
        return cls._blocks.get(name)

    @classmethod
    def list(cls) -> list[str]:
        return list(cls._blocks.keys())

    @classmethod
    def by_category(cls, category: str) -> list[BlockMeta]:
        return [b for b in cls._blocks.values() if b.category == category]
