from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec


def BUILD(params):
    return nn.AvgPool2d(kernel_size=params.get("kernel_size", 2))


BLOCK = BlockSpec(
    label="AvgPool2D",
    category="neural",
    params={
        "kernel_size": ParamSpec(type="int", default=2),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.AvgPool2d(kernel_size={params.kernel_size})"
    ),
)
