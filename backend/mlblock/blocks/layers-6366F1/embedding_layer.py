from __future__ import annotations

import torch
from torch import nn


class _EmbeddingModule(nn.Module):
    """Embedding apprenable en tant que Module (pas une opération éphémère)."""

    def __init__(self, num_embeddings: int, embedding_dim: int, padding_idx: int | None = None):
        super().__init__()
        self.emb = nn.Embedding(num_embeddings=num_embeddings, embedding_dim=embedding_dim, padding_idx=padding_idx)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.emb(x.long())


def embedding_layer(num_embeddings: "int", embedding_dim: "int", in_1: "torch.nn.Module" = None, padding_idx: "int" = None) -> "torch.nn.Module":  # noqa: F821
    """Embedding Layer.
    Couche d'embedding composable (nn.Module) : indices entiers vers vecteurs denses.

    Args:
        in_1: Couche précédente (optionnelle).
        num_embeddings: Taille du vocabulaire. (entre: 1-100000)
        embedding_dim: Dimension. (entre: 1-1024) (suggestions: 16|32|64|128|256)
        padding_idx: Index de padding.
    """
    layer = _EmbeddingModule(num_embeddings=num_embeddings, embedding_dim=embedding_dim, padding_idx=padding_idx)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
