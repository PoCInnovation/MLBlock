from torch import nn

from mlblock.models.block_spec import BlockSpec, PortSpec


def BUILD(params):
    return nn.Tanh()


BLOCK = BlockSpec(
    label="Tanh",
    category="neural",
    params={},
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Tanh()"
    ),
)
