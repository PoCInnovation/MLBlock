from typing import Any

from torch import nn

from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec


def BUILD(params: dict[str, Any]) -> nn.Module:
    return nn.Linear(
        in_features=params["in_features"],
        out_features=params["out_features"],
        bias=params.get("bias", True),
    )


BLOCK = BlockSpec(
    label="Linear (FC)",
    category="neural",
    params={
        "in_features": ParamSpec(type="int", required=True),
        "out_features": ParamSpec(type="int", required=True),
        "bias": ParamSpec(type="bool", default=True),
    },
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.Linear({params.in_features}, {params.out_features}, bias={params.bias})"
    ),
)
