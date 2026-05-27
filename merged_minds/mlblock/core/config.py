import json
from pathlib import Path
from typing import Any

from mlblock.models.pipeline import PipelineDef
from mlblock.models.registry import BlockRegistry


class ConfigLoader:
    def __init__(self, path: str | Path, registry: BlockRegistry | None = None):
        self.path = Path(path)
        self.registry = registry
        self.data: dict[str, Any] = {}

    def load(self) -> dict[str, Any]:
        raw = self.path.read_text(encoding="utf-8")
        if self.path.suffix in (".json",):
            self.data = json.loads(raw)
        else:
            raise ValueError(f"Unsupported config format: {self.path.suffix}")
        return self.data

    def validate(self, graph_data: dict[str, Any]) -> None:
        PipelineDef.model_validate(
            graph_data, context={"registry": self.registry}
        )
