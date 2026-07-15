_best_loss = None
_epochs_no_improve = 0


def BUILD(params):
    global _best_loss, _epochs_no_improve
    loss = params["_inputs"].get("loss")
    if isinstance(loss, dict):
        loss = list(loss.values())[0]
    patience = params.get("patience", 10)
    if _best_loss is None or loss < _best_loss:
        _best_loss = loss
        _epochs_no_improve = 0
    else:
        _epochs_no_improve += 1
    stop = _epochs_no_improve >= patience
    return {"stop": stop}


_TEMPLATE = (
    "if '{params.mode}' not in globals():\n"
    "    {params.mode}_best_loss = None\n"
    "    {params.mode}_epochs_no_improve = 0\n"
    "loss_{node_id} = {input.loss}\n"
    "if {params.mode}_best_loss is None or loss_{node_id} < {params.mode}_best_loss:\n"
    "    {params.mode}_best_loss = loss_{node_id}\n"
    "    {params.mode}_epochs_no_improve = 0\n"
    "else:\n"
    "    {params.mode}_epochs_no_improve += 1\n"
    "{output.stop} = {params.mode}_epochs_no_improve >= {params.patience}\n"
    "if {output.stop}:\n"
    "    print('Early stopping triggered')"
)

BLOCK = {
    "label": "Early Stopping",
    "category": "training",
    "params": {
        "patience": {"type": "int", "default": 10},
        "mode": {"type": "str", "default": "es"},
    },
    "inputs": [{"name": "loss", "dtype": "float"}],
    "outputs": [{"name": "stop", "dtype": "bool"}],
    "template": _TEMPLATE,
}
