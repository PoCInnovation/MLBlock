import torch
from torch import nn


def embedding(in_1: "torch.Tensor", num_embeddings: "int", embedding_dim: "int", padding_idx: "int" = None) -> "torch.Tensor":
    """Couche d'embedding.
    
    Args:
        in_1: Input tensor.
        num_embeddings: Taille du vocabulaire. (entre: 1-100000)
        embedding_dim: Dimension. (entre: 1-1024) (suggestions: 16|32|64|128|256)
        padding_idx: Parameter.
    """
    return nn.Embedding(num_embeddings=num_embeddings, embedding_dim=embedding_dim, padding_idx=padding_idx)(in_1)
