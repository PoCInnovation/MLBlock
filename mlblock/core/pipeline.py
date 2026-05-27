from __future__ import annotations

import torch.nn as nn

from .graph import Graph, GraphNode


class Pipeline:
    def __init__(self, graph: Graph) -> None:
        self.graph = graph
        self._order: list[str] = []

    def build_model(self) -> nn.Module:
        self._order = self.graph.topological_sort()
        layers: list[nn.Module] = []
        for node_id in self._order:
            node = self.graph.nodes[node_id]
            layer = self._build_node(node)
            if layer is not None:
                layers.append(layer)
        return nn.Sequential(*layers)

    def _build_node(self, node: GraphNode) -> nn.Module | None:
        if node.block is None:
            return None
        try:
            return node.block.build_layer(node.params)
        except NotImplementedError:
            return None
