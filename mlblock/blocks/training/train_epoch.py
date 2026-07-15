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
    model.train()
    model.to(device)
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
    return {"loss": avg_loss}


_TEMPLATE = (
    "{input.model}.train()\n"
    "total_loss_{node_id} = 0.0\n"
    "for data_{node_id}, target_{node_id} in {input.dataloader}:\n"
    "    {input.optimizer}.zero_grad()\n"
    "    output_{node_id} = {input.model}(data_{node_id})\n"
    "    loss_{node_id} = {input.loss_fn}(output_{node_id}, target_{node_id})\n"
    "    loss_{node_id}.backward()\n"
    "    {input.optimizer}.step()\n"
    "    total_loss_{node_id} += loss_{node_id}.item()\n"
    "{output.loss} = total_loss_{node_id} / len({input.dataloader})\n"
    "print(f'Epoch loss: {{total_loss_{node_id} / len({input.dataloader}):.4f}}')"
)

BLOCK = {
    "label": "Train Epoch",
    "category": "training",
    "params": {
        "device": {"type": "str", "default": "cpu"},
    },
    "inputs": [
        {"name": "model", "dtype": "Module"},
        {"name": "dataloader", "dtype": "DataLoader"},
        {"name": "optimizer", "dtype": "Optimizer"},
        {"name": "loss_fn", "dtype": "Loss"},
    ],
    "outputs": [{"name": "loss", "dtype": "float"}],
    "template": _TEMPLATE,
}
