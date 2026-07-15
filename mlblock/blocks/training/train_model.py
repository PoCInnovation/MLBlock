import torch


def BUILD(params):
    model = params["_inputs"].get("model")
    dataloader = params["_inputs"].get("dataloader")
    optimizer = params["_inputs"].get("optimizer")
    loss_fn = params["_inputs"].get("loss_fn")
    if isinstance(model, dict):
        model = list(model.values())[0]
    if isinstance(dataloader, dict):
        dataloader = list(dataloader.values())[0]
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    if isinstance(loss_fn, dict):
        loss_fn = list(loss_fn.values())[0]
    device = params.get("device", "cpu")
    epochs = params.get("epochs", 5)
    model.train()
    model.to(device)
    history = []
    for epoch in range(epochs):
        total_loss = 0.0
        for data, target in dataloader:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = loss_fn(output, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / max(len(dataloader), 1)
        history.append(avg_loss)
        print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_loss:.4f}")
    return {"model": model, "history": history}


_TEMPLATE = (
    "{input.model}.train()\n"
    "history_{node_id} = []\n"
    "for epoch_{node_id} in range({params.epochs}):\n"
    "    total_loss_{node_id} = 0.0\n"
    "    for data_{node_id}, target_{node_id} in {input.dataloader}:\n"
    "        {input.optimizer}.zero_grad()\n"
    "        output_{node_id} = {input.model}(data_{node_id})\n"
    "        loss_{node_id} = {input.loss_fn}(output_{node_id}, target_{node_id})\n"
    "        loss_{node_id}.backward()\n"
    "        {input.optimizer}.step()\n"
    "        total_loss_{node_id} += loss_{node_id}.item()\n"
    "    avg_loss_{node_id} = total_loss_{node_id} / len({input.dataloader})\n"
    "    history_{node_id}.append(avg_loss_{node_id})\n"
    "    print(f'Epoch {{epoch_{node_id} + 1}}/{params.epochs}, Loss: {{avg_loss_{node_id}:.4f}}')\n"
    "{output.model} = {input.model}\n"
    "{output.history} = history_{node_id}"
)

BLOCK = {
    "label": "Train Model",
    "category": "training",
    "params": {
        "epochs": {"type": "int", "default": 5},
        "device": {"type": "str", "default": "cpu"},
    },
    "inputs": [
        {"name": "model", "dtype": "Module"},
        {"name": "dataloader", "dtype": "DataLoader"},
        {"name": "optimizer", "dtype": "Optimizer"},
        {"name": "loss_fn", "dtype": "Loss"},
    ],
    "outputs": [
        {"name": "model", "dtype": "Module"},
        {"name": "history", "dtype": "list"},
    ],
    "template": _TEMPLATE,
}
