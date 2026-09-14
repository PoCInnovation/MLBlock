"""Compatibility adapters and legacy alias mappings for deprecated and merged blocks."""
from __future__ import annotations

LEGACY_BLOCK_ALIASES: dict[str, str] = {
    "conv2d": "conv2d_layer",
    "linear": "linear_layer",
    "conv1d": "conv1d_layer",
    "conv3d": "conv3d_layer",
    "conv_transpose2d": "conv_transpose2d_layer",
    "relu": "relu_layer",
    "maxpool2d": "maxpool2d_layer",
    "flatten": "flatten_layer",
}


def resolve_alias(name: str) -> str:
    """Resolve a legacy block name to its canonical counterpart."""
    return LEGACY_BLOCK_ALIASES.get(name, name)
