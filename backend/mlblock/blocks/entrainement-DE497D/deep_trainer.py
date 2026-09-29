from __future__ import annotations

from typing import Literal


def deep_trainer(
    in_1: "torch.utils.data.DataLoader",  # noqa: F821
    in_2: "torch.nn.Module",  # noqa: F821
    in_3: "torch.utils.data.DataLoader" = None,  # noqa: F821
    epochs: "int" = 5,
    optimizer: Literal["adam", "sgd"] = "adam",
    learning_rate: "float" = 0.001,
    loss_fn: Literal["cross_entropy", "mse"] = "cross_entropy",
    device: Literal["cpu", "cuda", "mps"] = "cpu",
) -> tuple["torch.nn.Module", "dict[str, list[float]]"]:  # noqa: F821
    """Entraîneur Universel (DeepTrainer)
    Orchestrateur d'entraînement multi-slots avec optimiseur et fonction de perte intégrés.

    Args:
        in_1: Données d'entraînement (DataLoader).
        in_2: Architecture du modèle (nn.Module).
        in_3: Données de validation optionnelles (DataLoader).
        epochs: Nombre d'époques d'apprentissage. (entre: 1-100, pas: 1) (suggestions: 5|10|20)
        optimizer: Algorithme d'optimisation. (choix: adam|sgd)
        learning_rate: Taux d'apprentissage. (entre: 0.00001-1.0) (suggestions: 0.001|0.01|0.1)
        loss_fn: Fonction de coût objectif. (choix: cross_entropy|mse)
        device: Matériel d'exécution du calcul. (choix: cpu|cuda|mps)
    """
    import torch.nn as nn
    import torch.optim as optim

    model = in_2.to(device)

    # Sélection de la fonction de perte
    criterion: nn.Module
    if loss_fn == "cross_entropy":
        criterion = nn.CrossEntropyLoss()
    else:
        criterion = nn.MSELoss()

    # Sélection de l'optimiseur
    opt: optim.Optimizer
    if optimizer == "sgd":
        opt = optim.SGD(model.parameters(), lr=learning_rate, momentum=0.9)
    else:
        opt = optim.Adam(model.parameters(), lr=learning_rate)

    history: list[float] = []

    for _ in range(epochs):
        model.train()
        running_loss = 0.0
        count = 0
        for batch in in_1:
            data, target = batch
            data = data.to(device)
            target = target.to(device)

            opt.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            opt.step()

            running_loss += float(loss.item())
            count += 1

        avg_loss = running_loss / max(count, 1)
        history.append(avg_loss)

    metrics = {"loss": history}
    return model, metrics
