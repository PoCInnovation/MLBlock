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


# ── Param metadata (docstring suffixes) ─────────────────────────────

def test_param_meta_range_and_step():
    from mlblock.blocks.registry import _extract_param_desc
    desc, meta = _extract_param_desc(
        "Bloc.\n\nArgs:\n    p: Probabilité de dropout. (entre: 0-1, pas: 0.05)",
        "p",
    )
    assert desc == "Probabilité de dropout."
    assert meta == {"min": 0.0, "max": 1.0, "step": 0.05}


def test_param_meta_choices_odd_format_len():
    from mlblock.blocks.registry import _extract_param_desc
    desc, meta = _extract_param_desc(
        "Args:\n    method: Métrique. (choix: mse|accuracy)\n    k: Taille. (impair)\n    s: Forme. (format: [C,H,W])\n    m: Moyennes. (longueur: 3)",
        "method",
    )
    assert meta["choices"] == ["mse", "accuracy"]
    assert desc == "Métrique."
    _, m2 = _extract_param_desc(
        "Args:\n    method: Métrique. (choix: mse|accuracy)\n    k: Taille. (impair)", "k")
    assert m2 == {"odd": True}
    _, m3 = _extract_param_desc(
        "Args:\n    s: Forme. (format: [C,H,W] | [N,C,H,W])", "s")
    assert m3["format"] == "[C,H,W] | [N,C,H,W]"
    _, m4 = _extract_param_desc("Args:\n    m: Moyennes. (longueur: 3)", "m")
    assert m4 == {"len": 3}


def test_param_meta_tolerates_plain_description():
    from mlblock.blocks.registry import _extract_param_desc
    desc, meta = _extract_param_desc(
        "Args:\n    in_1: Input tensor.\n    p: Parameter.", "in_1")
    assert desc == "Input tensor."
    assert meta == {}
    # parenthèses non-structurées dans la description → conservées
    desc2, meta2 = _extract_param_desc(
        "Args:\n    method: Métrique ('mse' ou 'accuracy').", "method")
    assert desc2 == "Métrique ('mse' ou 'accuracy')."
    assert meta2 == {}


def test_param_meta_from_discovered_blocks():
    p = BLOCK_REGISTRY["dropout"].params["p"]
    assert p.min == 0.0 and p.max == 1.0 and p.step == 0.05
    assert BLOCK_REGISTRY["evaluate"].params["method"].choices == ["mse", "accuracy", "f1", "precision", "recall"]
    assert BLOCK_REGISTRY["conv2d"].params["kernel_size"].odd is True
    assert BLOCK_REGISTRY["input"].params["shape"].format == "[C,H,W] | [N,C,H,W]"
    assert BLOCK_REGISTRY["normalize"].params["mean"].len == 3


def test_param_suggestions():
    from mlblock.blocks.registry import _extract_param_desc
    _, meta = _extract_param_desc(
        "Args:\n    out_channels: Canaux. (suggestions: 16|32|64|128)",
        "out_channels",
    )
    assert meta["suggestions"] == ["16", "32", "64", "128"]
    assert BLOCK_REGISTRY["conv2d"].params["out_channels"].suggestions == ["16", "32", "64", "128", "256"]
    assert BLOCK_REGISTRY["input"].params["shape"].suggestions == ["[1, 28, 28]", "[3, 32, 32]", "[1, 3, 224, 224]"]


def test_fr_label_from_docstring():
    from mlblock.server.routes import _fr_label
    assert _fr_label(BLOCK_REGISTRY["conv2d"]) == "Convolution 2D"
    assert _fr_label(BLOCK_REGISTRY["train_test_split"]) == "Séparer train/test"
    assert _fr_label(BLOCK_REGISTRY["cross_entropy_loss"]) == "Perte d'entropie croisée"


def test_fr_label_fallback():
    from mlblock.server.routes import _fr_label
    # docstring vide/générique → fallback name.title()
    class Fake:
        name = "load_csv"
        description = ""
    assert _fr_label(Fake()) == "Load Csv"


def test_fr_summary():
    from mlblock.server.routes import _fr_summary
    assert _fr_summary(BLOCK_REGISTRY["conv2d"]) == "Applique une convolution 2D sur le tenseur d'entrée"
    assert _fr_summary(BLOCK_REGISTRY["linear"]) == "Couche entièrement connectée : transforme l'entrée par une matrice apprise"
    # fallback label
    class Fake:
        name = "foo_bar"
        description = "Foo Bar.\n"
    assert _fr_summary(Fake()) == "Foo Bar"


# ── Dict port splitting ─────────────────────────────────────────────

def test_dict_annotation_parses_named_outputs():
    from mlblock.blocks.registry import _parse_return_annotation
    outs = _parse_return_annotation("dict[model: Model, transformed: numpy.ndarray]")
    assert outs == [
        {"name": "model", "dtype": "Model"},
        {"name": "transformed", "dtype": "numpy.ndarray"},
    ]


def test_dict_annotation_bare_stays_single():
    from mlblock.blocks.registry import _parse_return_annotation
    assert _parse_return_annotation("dict") == [{"name": "out_1", "dtype": "dict"}]


def test_dict_blocks_expose_named_outputs():
    assert [(p["name"], p["dtype"]) for p in BLOCK_REGISTRY["pca"].outputs] == [
        ("model", "Model"), ("transformed", "numpy.ndarray"),
    ]
    assert [(p["name"], p["dtype"]) for p in BLOCK_REGISTRY["standard_scaler"].outputs] == [
        ("scaler", "object"), ("scaled", "numpy.ndarray"),
    ]
    assert [(p["name"], p["dtype"]) for p in BLOCK_REGISTRY["train_model"].outputs] == [
        ("model", "torch.nn.Module"), ("history", "list"),
    ]


def test_dict_port_classification():
    from mlblock.core.types import build_conversion_graph, classify
    graph = build_conversion_graph(BLOCK_REGISTRY)
    # pca.transformed (ndarray) → to_tensor (ndarray) : compatible
    assert classify("numpy.ndarray", "numpy.ndarray", graph) == "compatible"
    # train_model.model (module) → sgd (module) : compatible
    assert classify("torch.nn.Module", "torch.nn.Module", graph) == "compatible"


def test_pipeline_resolves_dict_port():
    src_spec = {
        "label": "dictsrc",
        "category": "test",
        "params": {},
        "inputs": [],
        "outputs": [{"name": "transformed", "dtype": "numpy.ndarray"}, {"name": "model", "dtype": "Model"}],
        "template": "",
    }
    dst_spec = {
        "label": "dictdst",
        "category": "test",
        "params": {},
        "inputs": [{"name": "in_1", "dtype": "numpy.ndarray"}],
        "outputs": [{"name": "out_1", "dtype": "numpy.ndarray"}],
        "template": "",
    }
    CoreRegistry.register("dictsrc", src_spec, lambda: {"transformed": "T", "model": "M"})
    CoreRegistry.register("dictdst", dst_spec, lambda in_1: f"got:{in_1}")
    graph = Graph({
        "nodes": [{"id": "n1", "type": "dictsrc"}, {"id": "n2", "type": "dictdst"}],
        "edges": [{"source": "n1", "source_port": "transformed", "target": "n2", "target_port": "in_1"}],
    })
    outputs = Pipeline(graph).run()
    assert outputs["n2"] == "got:T"


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
