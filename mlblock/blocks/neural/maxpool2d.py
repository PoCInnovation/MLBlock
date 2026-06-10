from typing import Any

from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec


def BUILD(params: dict[str, Any]) -> nn.Module:
    return nn.MaxPool2d(
        kernel_size=params.get("kernel_size", 2),
        stride=params.get("stride", None),
    )


BLOCK = BlockSpec(
    label="MaxPool2D",
    category="neural",
    params={
        "kernel_size": ParamSpec(type="int", default=2),
        "stride": ParamSpec(type="int", default=None),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.MaxPool2d(kernel_size={params.kernel_size})"
    ),
)
