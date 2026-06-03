from typing import Any

from torch import nn

from mlblock.models.block_spec import BlockSpec, PortSpec


def BUILD(params: dict[str, Any]) -> nn.Module:
    return nn.ReLU()


BLOCK = BlockSpec(
    label="ReLU",
    category="neural",
    params={},
    inputs=[PortSpec(name="in", dtype="Tensor")],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template=(
        "import torch.nn as nn\n"
        "{output.out} = nn.ReLU()"
    ),
)
