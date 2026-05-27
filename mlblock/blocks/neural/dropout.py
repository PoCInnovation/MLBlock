from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Dropout",
    category="neural",
    params={
        "p": ParamSpec(type="float", default=0.5),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Dropout(p={params.p})"
    ),
)
