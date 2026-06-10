from __future__ import annotations

import torch.nn as nn

from mlblock.core.generator import CodeGenerator


class Pipeline:
    def __init__(self, graph) -> None:
        self.graph = graph

    def generate_code(self) -> str:
        generator = CodeGenerator(self.graph)
        return generator.generate()

    def build_model(self) -> nn.Module:
        order = self.graph.topological_sort()
        layers: list[nn.Module] = []
        for node_id in order:
            node = self.graph.nodes[node_id]
            if node.block is None:
                continue
            try:
                layer = node.block.build_layer(node.params)
                if layer is not None:
                    layers.append(layer)
            except NotImplementedError:
                pass
        return nn.Sequential(*layers)
