from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any


def _coerce_param_value(
    block_name: str, key: str, value: Any, ptype: str
) -> Any:
    """Coerce a frontend string param to its declared Python type.

    Empty string → None (optional param). Types come from ParamInfo
    ('int', 'float', 'bool', 'list[int]', 'int | None', 'str', 'file'…).
    """
    if value is None or value == "":
        return None
    t = ptype.split(" | ")[0].strip()
    try:
        if t == "int":
            return int(value)
        if t == "float":
            return float(value)
        if t == "bool":
            if isinstance(value, bool):
                return value
            return str(value).strip().lower() in ("true", "1", "yes", "on")
        if t.startswith("list"):
            if isinstance(value, list):
                return value
            return json.loads(value)
        return value
    except (ValueError, TypeError, json.JSONDecodeError) as e:
        raise TypeError(
            f"Paramètre '{key}' du bloc '{block_name}' : "
            f"'{value}' non convertible en {ptype}"
        ) from e


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

    def coerce_params(self, params: dict[str, Any]) -> None:
        """Coerce declared params (frontend strings) to their Python types."""
        declared = self.spec.get("params", {})
        for key, value in params.items():
            pinfo = declared.get(key)
            ptype = pinfo.get("type") if isinstance(pinfo, dict) else None
            if not ptype:
                continue
            params[key] = _coerce_param_value(self.name, key, value, ptype)

    def can_build(self) -> bool:
        return self._build_fn is not None

    def execute(self, params: dict[str, Any]) -> Any:
        if self._build_fn is not None:
            inputs = params.pop("_inputs", None) or {}
            self.coerce_params(params)
            params.update(inputs)
            result = self._build_fn(**params)
            if isinstance(result, dict):
                return result
            if len(self.outputs) > 1:
                # tuple/list result → {out_1: v0, out_2: v1}
                return {o["name"]: v for o, v in zip(self.outputs, result)}
            if len(self.outputs) == 1:
                return result
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
