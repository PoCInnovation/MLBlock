import pytest

from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.block import BlockRegistry as CoreRegistry
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline, _value_for
from mlblock.core.types import build_conversion_graph, classify
from mlblock.models.pipeline import PipelineDef, PipelineEdge, PipelineNode


# ── Inputs derivation ────────────────────────────────────────────────

def test_inputs_derivation_single_port():
    b = BLOCK_REGISTRY["linear"]
    assert b.inputs == [{"name": "in_1", "dtype": "torch.Tensor"}]
    # hyperparams stay params, not ports
    assert "in_features" not in [p["name"] for p in b.inputs]


def test_inputs_derivation_multi_input():
    b = BLOCK_REGISTRY["train_epoch"]
    names = [p["name"] for p in b.inputs]
    assert names == ["in_1", "in_2", "in_3", "in_4"]


def test_inputs_derivation_no_data_port():
    assert BLOCK_REGISTRY["load_csv"].inputs == []
    assert BLOCK_REGISTRY["input"].inputs == []


def test_inputs_derivation_semantic_names():
    b = BLOCK_REGISTRY["evaluate"]
    assert [p["name"] for p in b.inputs] == ["model", "test_data"]


# ── Multi-outputs ────────────────────────────────────────────────────

def test_tuple_annotation_splits_outputs():
    b = BLOCK_REGISTRY["train_test_split"]
    assert [p["name"] for p in b.outputs] == ["out_1", "out_2"]
    assert all(p["dtype"] == "pd.DataFrame" for p in b.outputs)
    r = BLOCK_REGISTRY["random_split"]
    assert [p["name"] for p in r.outputs] == ["out_1", "out_2"]


def test_execute_normalizes_tuple_to_named_outputs():
    spec = {
        "label": "src2",
        "category": "test",
        "params": {},
        "inputs": [],
        "outputs": [{"name": "out_1", "dtype": "A"}, {"name": "out_2", "dtype": "B"}],
        "template": "",
    }
    CoreRegistry.register("src2", spec, lambda: ("a", "b"))
    result = CoreRegistry.get("src2").execute({})
    assert result == {"out_1": "a", "out_2": "b"}


def test_execute_keeps_raw_single_output():
    spec = {
        "label": "src1",
        "category": "test",
        "params": {},
        "inputs": [],
        "outputs": [{"name": "out_1", "dtype": "A"}],
        "template": "",
    }
    CoreRegistry.register("src1", spec, lambda: "raw")
    assert CoreRegistry.get("src1").execute({}) == "raw"


def test_pipeline_resolves_by_source_port():
    src_spec = {
        "label": "src2b",
        "category": "test",
        "params": {},
        "inputs": [],
        "outputs": [{"name": "out_1", "dtype": "A"}, {"name": "out_2", "dtype": "B"}],
        "template": "",
    }
    dst_spec = {
        "label": "dst1",
        "category": "test",
        "params": {},
        "inputs": [{"name": "in_1", "dtype": "B"}],
        "outputs": [{"name": "out_1", "dtype": "B"}],
        "template": "",
    }
    CoreRegistry.register("src2b", src_spec, lambda: ("a", "b"))
    CoreRegistry.register("dst1", dst_spec, lambda in_1: in_1.upper())
    graph = Graph({
        "nodes": [{"id": "n1", "type": "src2b"}, {"id": "n2", "type": "dst1"}],
        "edges": [{"source": "n1", "source_port": "out_2", "target": "n2", "target_port": "in_1"}],
    })
    outputs = Pipeline(graph).run()
    assert outputs["n2"] == "B"


def test_value_for_raw_vs_dict():
    assert _value_for({"n": 42}, "n", "out_1") == 42
    assert _value_for({"n": {"out_1": 1, "out_2": 2}}, "n", "out_2") == 2


# ── Families + classifier ────────────────────────────────────────────

def test_conversion_graph_only_transforms():
    graph = build_conversion_graph(BLOCK_REGISTRY)
    assert graph.get("df") == {"tensor"}
    assert graph.get("ndarray") == {"tensor"}
    assert "module" not in graph  # training blocks are not converters


def test_classifier_verdicts():
    graph = build_conversion_graph(BLOCK_REGISTRY)
    assert classify("pd.DataFrame", "torch.Tensor", graph) == "convertible"
    assert classify("torch.Tensor", "torch.Tensor", graph) == "compatible"
    assert classify("pd.DataFrame", "object", graph) == "compatible"  # wildcard
    assert classify("torch.Tensor", "pd.DataFrame", graph) == "incompatible"
    assert classify("pd.DataFrame", "numpy.ndarray", graph) == "incompatible"


# ── Param coercion ──────────────────────────────────────────────────

_COERCE_SPEC = {
    "label": "coerce_test",
    "category": "test",
    "params": {
        "n": {"type": "int", "default": None, "required": True},
        "f": {"type": "float", "default": None, "required": True},
        "b": {"type": "bool", "default": None, "required": True},
        "l": {"type": "list[int]", "default": None, "required": False},
        "o": {"type": "int | None", "default": None, "required": False},
        "s": {"type": "str", "default": None, "required": False},
    },
    "inputs": [],
    "outputs": [{"name": "out_1", "dtype": "Any"}],
    "template": "",
}


def test_coerce_params_strings_to_types():
    captured = {}

    def build_fn(**kwargs):
        captured.update(kwargs)
        return kwargs

    CoreRegistry.register("coerce_test", _COERCE_SPEC, build_fn)
    CoreRegistry.get("coerce_test").execute({
        "n": "4", "f": "0.5", "b": "true", "l": "[1, 28, 28]", "o": "", "s": "toto",
    })
    assert captured["n"] == 4 and isinstance(captured["n"], int)
    assert captured["f"] == 0.5 and isinstance(captured["f"], float)
    assert captured["b"] is True
    assert captured["l"] == [1, 28, 28]
    assert captured["o"] is None
    assert captured["s"] == "toto"


def test_coerce_param_already_typed_passthrough():
    captured = {}

    def build_fn(**kwargs):
        captured.update(kwargs)
        return kwargs

    CoreRegistry.register("coerce_test", _COERCE_SPEC, build_fn)
    CoreRegistry.get("coerce_test").execute({"n": 4, "b": False, "o": None})
    assert captured["n"] == 4
    assert captured["b"] is False
    assert captured["o"] is None


def test_coerce_param_invalid_raises_clear_error():
    def build_fn(**kwargs):
        return kwargs

    CoreRegistry.register("coerce_test", _COERCE_SPEC, build_fn)
    with pytest.raises(TypeError, match="'n' du bloc 'coerce_test'.*'abc'"):
        CoreRegistry.get("coerce_test").execute({"n": "abc"})


def test_linear_runs_with_string_params():
    import torch

    b = CoreRegistry.get("linear")
    out = b.execute({"in_features": "4", "out_features": "8", "bias": "true", "in_1": torch.randn(2, 4)})
    assert isinstance(out, torch.Tensor)


# ── PipelineDef validation ───────────────────────────────────────────

def _validate(nodes, edges):
    return PipelineDef.model_validate(
        {"nodes": nodes, "edges": edges},
        context={"registry": BLOCK_REGISTRY},
    )


def test_validate_accepts_compatible_edges():
    nodes = [
        PipelineNode(id="n1", type="load_csv"),
        PipelineNode(id="n2", type="knn"),
    ]
    edges = [PipelineEdge(source="n1", source_port="out_1", target="n2", target_port="in_1")]
    _validate(nodes, edges)  # must not raise


def test_validate_rejects_incompatible_edges():
    nodes = [
        PipelineNode(id="n1", type="conv2d"),
        PipelineNode(id="n2", type="knn"),
    ]
    edges = [PipelineEdge(source="n1", source_port="out_1", target="n2", target_port="in_1")]
    with pytest.raises(ValueError, match="Type mismatch"):
        _validate(nodes, edges)


def test_validate_accepts_convertible_edges():
    nodes = [
        PipelineNode(id="n1", type="load_csv"),
        PipelineNode(id="n2", type="conv2d"),
    ]
    edges = [PipelineEdge(source="n1", source_port="out_1", target="n2", target_port="in_1")]
    _validate(nodes, edges)  # convertible — allowed, converter materializes in UI
