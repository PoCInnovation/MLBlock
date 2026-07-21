from __future__ import annotations

from typing import Any

from mlblock.core.generator import CodeGenerator


class Pipeline:
    def __init__(self, graph) -> None:
        self.graph = graph

    def generate_code(self) -> str:
        generator = CodeGenerator(self.graph)
        return generator.generate()

    def run(self):
        order = self.graph.topological_sort()
        outputs: dict[str, Any] = {}
        for node_id in order:
            node = self.graph.nodes[node_id]
            inputs = {}
            for edge in self.graph.edges:
                if edge.target == node_id:
                    inputs[edge.target_port] = outputs.get(edge.source)
            node.params["_inputs"] = inputs
            try:
                result = node.block.execute(node.params)
                if result is not None:
                    outputs[node_id] = result
            except NotImplementedError:
                pass
        return outputs
