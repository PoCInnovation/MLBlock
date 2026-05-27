from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Softmax",
    category="neural",
    params={
        "dim": ParamSpec(type="int", default=1),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Softmax(dim={params.dim})"
    ),
)
