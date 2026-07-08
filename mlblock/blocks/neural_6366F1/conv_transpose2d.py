from torch import nn


def BUILD(params):
    return nn.ConvTranspose2d(
        in_channels=params["in_channels"],
        out_channels=params["out_channels"],
        kernel_size=params.get("kernel_size", 3),
        stride=params.get("stride", 1),
        padding=params.get("padding", 0),
        output_padding=params.get("output_padding", 0),
    )


BLOCK = {
    "label": "ConvTranspose2D",
    "category": "neural",
    "params": {
        "in_channels": {"type": "int", "required": True},
        "out_channels": {"type": "int", "required": True},
        "kernel_size": {"type": "int", "default": 3},
        "stride": {"type": "int", "default": 1},
        "padding": {"type": "int", "default": 0},
        "output_padding": {"type": "int", "default": 0},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.ConvTranspose2d({params.in_channels}, {params.out_channels}, "
        "kernel_size={params.kernel_size}, stride={params.stride}, "
        "padding={params.padding}, output_padding={params.output_padding})"
    ),
}
