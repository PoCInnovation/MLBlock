import json
from pathlib import Path
from typing import Any


class ConfigLoader:
    def __init__(self, path: str | Path, registry: dict[str, Any] | None = None):
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
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])
        if "nodes" not in graph_data:
            raise ValueError("Missing 'nodes' in graph data")
        if "edges" not in graph_data:
            raise ValueError("Missing 'edges' in graph data")
        for node in nodes:
            if "id" not in node:
                raise ValueError("Node missing 'id'")
            if "type" not in node:
                raise ValueError("Node missing 'type'")
            if self.registry and node["type"] not in self.registry:
                raise ValueError(
                    f"Unknown block type '{node['type']}' (node '{node.get('id', '?')}')"
                )
        node_map = {n["id"]: n for n in nodes}
        for edge in edges:
            for key in ("source", "source_port", "target", "target_port"):
                if key not in edge:
                    raise ValueError(f"Edge missing '{key}'")
            for side, port_key in [("source", "source_port"), ("target", "target_port")]:
                node_id = edge[side]
                node = node_map.get(node_id)
                if node is None:
                    raise ValueError(
                        f"Node '{node_id}' not found "
                        f"(edge: {edge['source']}.{edge['source_port']} -> {edge['target']}.{edge['target_port']})"
                    )
                if self.registry:
                    spec = self.registry[node["type"]]
                    direction = "outputs" if side == "source" else "inputs"
                    ports = getattr(spec, direction, [])
                    # Skip port validation when registry doesn't populate ports
                    if ports:
                        port_name = edge[port_key]
                        if not any(p["name"] == port_name for p in ports):
                            valid = [p["name"] for p in ports]
                            raise ValueError(
                                f"Port '{port_name}' not found on {side} '{node_id}' ({node['type']}). "
                                f"Valid ports: {valid}"
                            )
        for edge in edges:
            src_node = node_map[edge["source"]]
            tgt_node = node_map[edge["target"]]
            src_spec = self.registry[src_node["type"]]
            tgt_spec = self.registry[tgt_node["type"]]
            if not src_spec.outputs or not tgt_spec.inputs:
                continue
            src_dtype = next(
                p["dtype"] for p in src_spec.outputs
                if p["name"] == edge["source_port"]
            )
            tgt_dtype = next(
                p["dtype"] for p in tgt_spec.inputs
                if p["name"] == edge["target_port"]
            )
            if src_dtype != tgt_dtype:
                raise ValueError(
                    f"Type mismatch: {edge['source']}.{edge['source_port']} ({src_dtype}) -> "
                    f"{edge['target']}.{edge['target_port']} ({tgt_dtype})"
                )
