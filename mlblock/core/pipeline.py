from __future__ import annotations

from mlblock.core.generator import CodeGenerator


class Pipeline:
    def __init__(self, graph) -> None:
        self.graph = graph

    def generate_code(self) -> str:
        generator = CodeGenerator(self.graph)
        return generator.generate()
