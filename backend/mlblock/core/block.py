from __future__ import annotations

from collections.abc import Callable
from typing import Any


class BlockMeta:
    def __init__(
        self,
        name: str,
        spec: dict[str, Any],
        build_fn: Callable[[dict[str, Any]], Any] | None = None,
    ) -> None:
        self.name = name
        self.spec = spec
        self._build_fn = build_fn

    @property
    def label(self) -> str:
        return self.spec["label"]

    @property
    def category(self) -> str:
        return self.spec["category"]

    @property
    def params(self) -> dict[str, dict[str, Any]]:
        return self.spec["params"]

    @property
    def inputs(self) -> list[dict[str, str]]:
        return self.spec.get("inputs", [])

    @property
    def outputs(self) -> list[dict[str, str]]:
        return self.spec.get("outputs", [])

    @property
    def template(self) -> str:
        return self.spec.get("template", "")

    def build_layer(self, params: dict[str, Any]) -> Any:
        return self.execute(params)

    def can_build(self) -> bool:
        return self._build_fn is not None

    def execute(self, params: dict[str, Any]) -> Any:
        if self._build_fn is not None:
            inputs = params.pop("_inputs", None) or {}
            params.update(inputs)
            result = self._build_fn(**params)
            if isinstance(result, dict):
                return result
            if len(self.outputs) == 1:
                return result
            if self.outputs:
                return {self.outputs[0]["name"]: result}
            return {}
        raise NotImplementedError(
            f"Block '{self.name}' n'a pas de builder enregistré"
        )


class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}

    @classmethod
    def register(
        cls,
        name: str,
        spec: dict[str, Any],
        build_fn: Callable[[dict[str, Any]], Any] | None = None,
    ) -> None:
        cls._blocks[name] = BlockMeta(name, spec, build_fn)

    @classmethod
    def register_builder(
        cls,
        name: str,
        build_fn: Callable[[dict[str, Any]], Any],
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
        return [b for b in cls._blocks.values() if b.spec["category"] == category]
