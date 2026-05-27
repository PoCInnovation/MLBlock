import json
from pathlib import Path
from typing import Any


class ConfigLoader:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.data: dict[str, Any] = {}

    def load(self) -> dict[str, Any]:
        raw = self.path.read_text(encoding="utf-8")
        if self.path.suffix in (".json",):
            self.data = json.loads(raw)
        else:
            raise ValueError(f"Unsupported config format: {self.path.suffix}")
        return self.data

    @staticmethod
    def validate(graph_data: dict[str, Any]) -> None:
        if "nodes" not in graph_data:
            raise ValueError("Missing 'nodes' in graph definition")
        if "edges" not in graph_data:
            raise ValueError("Missing 'edges' in graph definition")
        for node in graph_data["nodes"]:
            if "id" not in node or "type" not in node:
                raise ValueError(f"Each node must have 'id' and 'type': {node}")
        for edge in graph_data["edges"]:
            for key in ("source", "source_port", "target", "target_port"):
                if key not in edge:
                    raise ValueError(f"Each edge must have '{key}': {edge}")
