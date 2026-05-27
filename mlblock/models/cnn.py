from __future__ import annotations

from pathlib import Path

import torch.nn as nn

from mlblock.core.config import ConfigLoader
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


def build_cnn_from_config(config_path: str | Path) -> nn.Module:
    loader = ConfigLoader(config_path)
    data = loader.load()
    graph_data = data.get("graph", data)
    ConfigLoader.validate(graph_data)
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    return pipeline.build_model()
