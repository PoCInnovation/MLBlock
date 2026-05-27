from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="BatchNorm2D",
    category="neural",
    params={
        "num_features": ParamSpec(type="int", required=True),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.BatchNorm2d({params.num_features})"
    ),
)
