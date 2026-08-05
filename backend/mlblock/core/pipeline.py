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
                    inputs[edge.target_port] = _value_for(
                        outputs, edge.source, edge.source_port
                    )
            node.params["_inputs"] = inputs
            try:
                result = node.block.execute(node.params)
                if result is not None:
                    outputs[node_id] = result
            except NotImplementedError:
                pass
        return outputs


def _value_for(outputs: dict[str, Any], node_id: str, port: str) -> Any:
    """Resolve a node's output value for a given source port.

    Multi-output nodes store {port: value}; single-output nodes store the
    raw value (which is returned for any port).
    """
    val = outputs.get(node_id)
    if isinstance(val, dict) and port in val:
        return val[port]
    return val
