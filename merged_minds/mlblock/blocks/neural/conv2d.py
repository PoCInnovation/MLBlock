from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Conv2D",
    category="neural",
    params={
        "in_channels": ParamSpec(type="int", required=True),
        "out_channels": ParamSpec(type="int", required=True),
        "kernel_size": ParamSpec(type="int", default=3),
        "stride": ParamSpec(type="int", default=1),
        "padding": ParamSpec(type="int", default=0),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Conv2d({params.in_channels}, {params.out_channels}, "
        "kernel_size={params.kernel_size}, stride={params.stride}, padding={params.padding})"
    ),
)
