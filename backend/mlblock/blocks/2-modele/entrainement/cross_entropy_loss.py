import torch

def cross_entropy_loss() -> "torch.nn.CrossEntropyLoss":
    """Cross-Entropy Loss.
    Perte d'entropie croisée (classification).
    
    Exemple: cross_entropy_loss()
    """
    return torch.nn.CrossEntropyLoss()
