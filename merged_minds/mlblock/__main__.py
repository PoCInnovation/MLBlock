import argparse
import json
from pathlib import Path

import torch

from mlblock.models.pipeline import PipelineDef
from mlblock.models.registry import BlockRegistry
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


def main():
    parser = argparse.ArgumentParser(description="MLBlock — visual block builder")
    parser.add_argument("config", nargs="?", default="configs/cnn_mnist.json",
                        help="Chemin du fichier de configuration JSON")
    parser.add_argument("--mode", choices=["generate", "build"], default="generate",
                        help="generate: produit du code Python, build: construit et exécute le modèle live")
    args = parser.parse_args()

    raw = json.loads(Path(args.config).read_text())
    graph_data = raw.get("graph", raw)

    registry = BlockRegistry(BLOCK_REGISTRY)
    PipelineDef.model_validate(graph_data, context={"registry": registry})

    graph = Graph(graph_data)
    pipeline = Pipeline(graph)

    if args.mode == "build":
        model = pipeline.build_model()
        print(f"Modèle construit : {model}")
        print()

        input_node = graph.get_input_nodes()
        if input_node:
            shape = input_node[0].params.get("shape", [1, 28, 28])
            dummy = torch.randn(1, *shape)
            print(f"Entrée : shape {tuple(dummy.shape)}")
            output = model(dummy)
            print(f"Sortie : shape {tuple(output.shape)}")
            print(f"Valeurs : {output}")
        else:
            print("Aucun nœud d'entrée trouvé pour exécuter le modèle.")
    else:
        code = pipeline.generate_code()
        print(code)


if __name__ == "__main__":
    main()
