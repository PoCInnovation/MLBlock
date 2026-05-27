from __future__ import annotations

from pathlib import Path

from mlblock.core.config import ConfigLoader
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.models.registry import BlockRegistry


def generate_code_from_config(config_path: str | Path) -> str:
    registry = BlockRegistry(BLOCK_REGISTRY)
    loader = ConfigLoader(config_path, registry)
    data = loader.load()
    graph_data = data.get("graph", data)
    loader.validate(graph_data)
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    return pipeline.generate_code()
