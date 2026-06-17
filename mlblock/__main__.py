import argparse
import json
from pathlib import Path

import torch

from mlblock.core.config import ConfigLoader
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


def main():
    parser = argparse.ArgumentParser(description="MLBlock - Pipeline builder")
    parser.add_argument("config", nargs="?", default="configs/cnn_mnist.json",
                        help="Path to pipeline JSON config")
    parser.add_argument("--mode", choices=["generate", "build"], default="generate",
                        help="generate: produit du code Python, build: construit et exécute le modèle")
    args = parser.parse_args()

    raw = json.loads(Path(args.config).read_text())
    graph_data = raw.get("graph", raw)

    loader = ConfigLoader(args.config, BLOCK_REGISTRY)
    loader.validate(graph_data)

    graph = Graph(graph_data)
    pipeline = Pipeline(graph)

    if args.mode == "build":
        outputs = pipeline.run()
        import torch.nn as nn
        layers = []
        for result in outputs.values():
            if isinstance(result, dict):
                for v in result.values():
                    if isinstance(v, nn.Module):
                        layers.append(v)
        model = nn.Sequential(*layers) if layers else list(outputs.values())[-1]
        input_node = graph.get_input_nodes()[0]
        shape = input_node.params.get("shape", [1, 28, 28])
        dummy = torch.randn(1, *shape)
        output = model(dummy)
        print(f"Modèle construit avec succès : {model}")
        print(f"Entrée : shape {tuple(dummy.shape)}")
        print(f"Sortie : shape {tuple(output.shape)}")
        print(f"Valeurs : {output}")
    else:
        code = pipeline.generate_code()
        print(code)


if __name__ == "__main__":
    main()
