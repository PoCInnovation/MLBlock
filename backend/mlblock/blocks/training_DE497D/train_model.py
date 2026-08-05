from typing import Literal

import torch


def train_model(in_1: "torch.nn.Module", in_2: "torch.utils.data.DataLoader", in_3: "torch.optim.Optimizer", in_4: "torch.nn.Module", epochs: "int" = 5, device: Literal["cpu", "cuda", "mps"] = "cpu") -> "dict":
    """Train model.
    
    Args:
        in_1: Model.
        in_2: Dataloader.
        in_3: Optimizer.
        in_4: Loss function.
        epochs: Number of epochs.
        device: Device to train on.
    """
    in_1.to(device)
    history = []
    for epoch in range(epochs):
        in_1.train()
        total_loss = 0.0
        for batch in in_2:
            data, target = batch
            data, target = data.to(device), target.to(device)
            in_3.zero_grad()
            output = in_1(data)
            loss = in_4(output, target)
            loss.backward()
            in_3.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(in_2)
        history.append(avg_loss)
    return {"model": in_1, "history": history}
