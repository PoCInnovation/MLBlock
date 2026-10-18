from __future__ import annotations


def sequential_container(in_1: "torch.Tensor" = None) -> "torch.nn.Module":  # noqa: F821
    """Conteneur Séquentiel
    Empile des couches de réseau de neurones en une architecture séquentielle unifiée.
    in_1: Tenseur d'entrée optionnel pour inférence de forme
    """
    import torch.nn as nn

    return nn.Sequential()
