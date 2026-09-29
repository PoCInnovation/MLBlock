from mlblock.core.block import BlockRegistry
from mlblock.blocks.registry import BLOCK_REGISTRY


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
    assert "conv2d_layer" in blocks
    assert "relu_layer" in blocks
    assert "linear_layer" in blocks


def test_block_registry_by_category():
    neural_blocks = BlockRegistry.by_category("layers")
    assert len(neural_blocks) > 0
    names = [b.name for b in neural_blocks]
    assert "conv2d_layer" in names
    assert "linear_layer" in names


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


def test_literal_param_has_options():
    block = BLOCK_REGISTRY.get("decision_tree")
    assert block is not None
    task_param = block.params["task"]
    assert task_param.options == ["classification", "regression"]
    assert task_param.type == "str"


def test_literal_param_multiple_choices():
    block = BLOCK_REGISTRY.get("svm")
    assert block is not None
    assert block.params["task"].options == ["classification", "regression"]
    assert block.params["kernel"].options == ["rbf", "linear", "poly", "sigmoid"]


def test_non_literal_param_has_no_options():
    block = BLOCK_REGISTRY.get("linear")
    assert block is not None
    assert block.params["in_features"].options is None
    assert block.params["out_features"].options is None


def test_tsne_visualization():
    import pandas as pd
    from mlblock.blocks.registry import BLOCK_REGISTRY
    from mlblock.core.type_system import type_system
    from mlblock.core.stages import Stage

    block = BLOCK_REGISTRY.get("tsne")
    assert block is not None
    assert block.category.name == "visualisation"
    assert type_system.stage_of("tsne") == Stage.EVAL
    # Test execution produces valid PNG bytes
    from mlblock.core.block import BlockRegistry
    km_meta = BlockRegistry.get("kmeans")
    tsne_meta = BlockRegistry.get("tsne")
    assert km_meta is not None
    assert tsne_meta is not None

    df = pd.DataFrame({
        "x": [1.0, 1.2, 0.9, 8.0, 8.2, 7.9],
        "y": [1.1, 0.8, 1.0, 8.1, 7.8, 8.0],
    })
    km = km_meta.execute({"in_1": df, "n_clusters": 2})
    png_bytes = tsne_meta.execute({"in_1": df, "model": km, "perplexity": 2.0})
    assert isinstance(png_bytes, bytes)
    assert png_bytes.startswith(b"\x89PNG\r\n\x1a\n")
