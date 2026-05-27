from __future__ import annotations

from typing import Any

import torch.nn as nn

from mlblock.core.block import BlockRegistry

CNN_BLOCK_DEFS: dict[str, dict[str, Any]] = {
    "input": {
        "label": "Input",
        "category": "cnn",
        "params": {
            "shape": {"type": "list[int]", "required": True},
        },
        "inputs": [],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "",
    },
    "conv2d": {
        "label": "Conv2D",
        "category": "cnn",
        "params": {
            "in_channels": {"type": "int", "required": True},
            "out_channels": {"type": "int", "required": True},
            "kernel_size": {"type": "int", "default": 3},
            "stride": {"type": "int", "default": 1},
            "padding": {"type": "int", "default": 0},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Conv2d({params.in_channels}, {params.out_channels}, kernel_size={params.kernel_size}, stride={params.stride}, padding={params.padding})",
    },
    "maxpool2d": {
        "label": "MaxPool2D",
        "category": "cnn",
        "params": {
            "kernel_size": {"type": "int", "default": 2},
            "stride": {"type": "int", "default": None},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.MaxPool2d(kernel_size={params.kernel_size})",
    },
    "avgpool2d": {
        "label": "AvgPool2D",
        "category": "cnn",
        "params": {
            "kernel_size": {"type": "int", "default": 2},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.AvgPool2d(kernel_size={params.kernel_size})",
    },
    "relu": {
        "label": "ReLU",
        "category": "cnn",
        "params": {},
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.ReLU()",
    },
    "sigmoid": {
        "label": "Sigmoid",
        "category": "cnn",
        "params": {},
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Sigmoid()",
    },
    "tanh": {
        "label": "Tanh",
        "category": "cnn",
        "params": {},
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Tanh()",
    },
    "flatten": {
        "label": "Flatten",
        "category": "cnn",
        "params": {},
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Flatten()",
    },
    "linear": {
        "label": "Linear (FC)",
        "category": "cnn",
        "params": {
            "in_features": {"type": "int", "required": True},
            "out_features": {"type": "int", "required": True},
            "bias": {"type": "bool", "default": True},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Linear({params.in_features}, {params.out_features}, bias={params.bias})",
    },
    "dropout": {
        "label": "Dropout",
        "category": "cnn",
        "params": {
            "p": {"type": "float", "default": 0.5},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Dropout(p={params.p})",
    },
    "batchnorm2d": {
        "label": "BatchNorm2D",
        "category": "cnn",
        "params": {
            "num_features": {"type": "int", "required": True},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.BatchNorm2d({params.num_features})",
    },
    "softmax": {
        "label": "Softmax",
        "category": "cnn",
        "params": {
            "dim": {"type": "int", "default": 1},
        },
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "self.{node_id} = nn.Softmax(dim={params.dim})",
    },
}


def _build_conv2d(params: dict[str, Any]) -> nn.Module:
    return nn.Conv2d(
        in_channels=params["in_channels"],
        out_channels=params["out_channels"],
        kernel_size=params.get("kernel_size", 3),
        stride=params.get("stride", 1),
        padding=params.get("padding", 0),
    )


def _build_maxpool2d(params: dict[str, Any]) -> nn.Module:
    return nn.MaxPool2d(
        kernel_size=params.get("kernel_size", 2),
        stride=params.get("stride", None),
    )


def _build_avgpool2d(params: dict[str, Any]) -> nn.Module:
    return nn.AvgPool2d(kernel_size=params.get("kernel_size", 2))


def _build_relu(params: dict[str, Any]) -> nn.Module:
    return nn.ReLU()


def _build_sigmoid(params: dict[str, Any]) -> nn.Module:
    return nn.Sigmoid()


def _build_tanh(params: dict[str, Any]) -> nn.Module:
    return nn.Tanh()


def _build_flatten(params: dict[str, Any]) -> nn.Module:
    return nn.Flatten()


def _build_linear(params: dict[str, Any]) -> nn.Module:
    return nn.Linear(
        in_features=params["in_features"],
        out_features=params["out_features"],
        bias=params.get("bias", True),
    )


def _build_dropout(params: dict[str, Any]) -> nn.Module:
    return nn.Dropout(p=params.get("p", 0.5))


def _build_batchnorm2d(params: dict[str, Any]) -> nn.Module:
    return nn.BatchNorm2d(num_features=params["num_features"])


def _build_softmax(params: dict[str, Any]) -> nn.Module:
    return nn.Softmax(dim=params.get("dim", 1))


CNN_BUILDERS = {
    "conv2d": _build_conv2d,
    "maxpool2d": _build_maxpool2d,
    "avgpool2d": _build_avgpool2d,
    "relu": _build_relu,
    "sigmoid": _build_sigmoid,
    "tanh": _build_tanh,
    "flatten": _build_flatten,
    "linear": _build_linear,
    "dropout": _build_dropout,
    "batchnorm2d": _build_batchnorm2d,
    "softmax": _build_softmax,
}


def register_cnn_blocks() -> None:
    BlockRegistry.register_batch(CNN_BLOCK_DEFS, CNN_BUILDERS)
