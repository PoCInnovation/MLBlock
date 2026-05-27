import json
import sys
from pathlib import Path

from mlblock.models.pipeline import PipelineDef
from mlblock.models.registry import BlockRegistry
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "configs/cnn_mnist.json"
    raw = json.loads(Path(path).read_text())
    graph_data = raw.get("graph", raw)

    registry = BlockRegistry(BLOCK_REGISTRY)
    PipelineDef.model_validate(graph_data, context={"registry": registry})

    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    print(code)


if __name__ == "__main__":
    main()
