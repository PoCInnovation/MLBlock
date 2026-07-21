from mlblock.core.block import BlockRegistry


def test_block_registry_register_and_get():
    spec = {
        "label": "Test",
        "category": "test",
        "params": {"x": {"type": "int", "default": 1}},
        "inputs": [{"name": "in", "dtype": "Tensor"}],
        "outputs": [{"name": "out", "dtype": "Tensor"}],
        "template": "",
    }
    BlockRegistry.register("test_block", spec)
    block = BlockRegistry.get("test_block")
    assert block is not None
    assert block.name == "test_block"
    assert block.label == "Test"
    assert "x" in block.params


def test_block_registry_get_unknown():
    assert BlockRegistry.get("nonexistent") is None


def test_block_registry_list():
    blocks = BlockRegistry.list()
    assert "conv2d" in blocks
    assert "relu" in blocks
    assert "linear" in blocks


def test_block_registry_by_category():
    neural_blocks = BlockRegistry.by_category("neural")
    assert len(neural_blocks) > 0
    names = [b.name for b in neural_blocks]
    assert "conv2d" in names
    assert "softmax" in names


def test_block_meta_params_schema():
    block = BlockRegistry.get("linear")
    assert block is not None
    assert "in_features" in block.params
    assert block.params["in_features"]["required"] is True
    assert "bias" in block.params
    assert block.params["bias"]["default"] is True


def test_block_meta_template():
    block = BlockRegistry.get("conv2d")
    assert block is not None
    # template is not populated by discovery — always empty
    assert block.template == ""
