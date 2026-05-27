from mlblock.core.block import BlockMeta, BlockRegistry


def test_block_registry_register_and_get():
    BlockRegistry.register(
        "test_block",
        {
            "label": "Test",
            "category": "test",
            "params": {"x": {"type": "int", "default": 1}},
            "inputs": [{"name": "in", "dtype": "Tensor"}],
            "outputs": [{"name": "out", "dtype": "Tensor"}],
        },
    )
    block = BlockRegistry.get("test_block")
    assert block is not None
    assert block.name == "test_block"
    assert block.label == "Test"
    assert block.params == {"x": {"type": "int", "default": 1}}


def test_block_registry_get_unknown():
    assert BlockRegistry.get("nonexistent") is None


def test_block_registry_list():
    blocks = BlockRegistry.list()
    assert "conv2d" in blocks
    assert "relu" in blocks
    assert "linear" in blocks


def test_block_registry_by_category():
    cnn_blocks = BlockRegistry.by_category("cnn")
    assert len(cnn_blocks) > 0
    names = [b.name for b in cnn_blocks]
    assert "conv2d" in names
    assert "softmax" in names


def test_build_layer():
    import torch.nn as nn

    block = BlockRegistry.get("conv2d")
    assert block is not None
    layer = block.build_layer(
        {"in_channels": 1, "out_channels": 32, "kernel_size": 3}
    )
    assert isinstance(layer, nn.Conv2d)
    assert layer.in_channels == 1
    assert layer.out_channels == 32
    assert layer.kernel_size == (3, 3)


def test_build_layer_with_defaults():
    import torch.nn as nn
    block = BlockRegistry.get("conv2d")
    assert block is not None
    layer = block.build_layer({"in_channels": 3, "out_channels": 64})
    assert isinstance(layer, nn.Conv2d)
    assert layer.in_channels == 3
    assert layer.out_channels == 64
    assert layer.kernel_size == (3, 3)  # default


def test_build_layer_no_builder_raises():
    block = BlockRegistry.get("input")
    assert block is not None
    import pytest
    with pytest.raises(NotImplementedError):
        block.build_layer({"shape": [1, 28, 28]})


def test_block_meta_params_schema():
    block = BlockRegistry.get("linear")
    assert block is not None
    assert "in_features" in block.params
    assert block.params["in_features"]["required"] is True
    assert "bias" in block.params
    assert block.params["bias"]["default"] is True
