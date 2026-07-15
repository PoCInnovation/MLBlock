import torch
from torch import nn


def embedding(x: "torch.Tensor", num_embeddings: "int", embedding_dim: "int", padding_idx: "int" = None) -> "torch.Tensor":
    """Embedding.
    
    Args:
        x: Input tensor.
        num_embeddings: Parameter.
        embedding_dim: Parameter.
        padding_idx: Parameter.
    """
    return nn.Embedding(num_embeddings=num_embeddings, embedding_dim=embedding_dim, padding_idx=padding_idx)(x)
