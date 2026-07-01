from torch import nn


def BUILD(params):
    return nn.Embedding(
        num_embeddings=params["num_embeddings"],
        embedding_dim=params["embedding_dim"],
        padding_idx=params.get("padding_idx"),
    )


BLOCK = {
    "label": "Embedding",
    "category": "neural",
    "params": {
        "num_embeddings": {"type": "int", "required": True},
        "embedding_dim": {"type": "int", "required": True},
        "padding_idx": {"type": "int", "default": None},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Embedding({params.num_embeddings}, {params.embedding_dim}"
        "{', padding_idx=' + str(params.padding_idx) if params.padding_idx is not None else ''})"
    ),
}
