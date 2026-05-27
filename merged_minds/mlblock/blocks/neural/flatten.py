from torch import nn

from mlblock.models.block_spec import BlockSpec, PortSpec

BLOCK = BlockSpec(
    label="Flatten",
    category="neural",
    params={},
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Flatten()"
    ),
)
