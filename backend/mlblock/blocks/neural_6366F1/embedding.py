import torch
from torch import nn


def embedding(in_1: "torch.Tensor", num_embeddings: "int", embedding_dim: "int", padding_idx: "int" = None) -> "torch.Tensor":
    """Embedding.
    
    Args:
        in_1: Input tensor.
        num_embeddings: Parameter.
        embedding_dim: Parameter.
        padding_idx: Parameter.
    """
    return nn.Embedding(num_embeddings=num_embeddings, embedding_dim=embedding_dim, padding_idx=padding_idx)(in_1)
