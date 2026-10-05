"""Three-stage Pipeline regression tests (openspec backend-three-stage-blocks).

Covers: MacroStage/engine tagging, strict framework sealing inside
containers, and MLflow setup injection in generated code.
"""
from __future__ import annotations


def test_macro_and_engine_tags():
    from mlblock.catalog import catalog

    assert catalog.get("xgboost_classifier") is not None
    assert catalog.get("xgboost_regressor") is not None
    assert catalog.get("mlflow_tracker") is not None

    assert catalog.get("logistic_regression").engine == "sklearn"
    assert catalog.get("conv2d_layer").engine == "pytorch"
    assert catalog.get("create_env").engine == "gym"
    assert catalog.get("mlflow_tracker").engine == "mlflow"

    assert int(catalog.get("load_csv").macro_stage) == 1
    assert int(catalog.get("conv2d_layer").macro_stage) == 2
    assert int(catalog.get("plot_predictions").macro_stage) == 3
    assert int(catalog.get("df_to_tensor").macro_stage) == 99
    assert catalog.get("df_to_tensor").is_transition is True
    assert catalog.get("conv2d_layer").is_transition is False


def test_superblocks_expose_pedagogical_titles():
    from mlblock.catalog import catalog

    sbs = {sb["id"]: sb for sb in catalog.superblocks()}
    assert sbs["mlflow_tracker"]["label"] == sbs["mlflow_tracker"]["title"]
    assert sbs["mlflow_tracker"]["title"] == "Suivi & Historique d'Expérience (MLflow)"
    assert sbs["xgboost_trainer"]["macro_stage"] == 2


def test_container_rejects_mixed_frameworks():
    from mlblock.validation import validate

    nodes = [
        {
            "id": "c1",
            "type": "sequential_container",
            "children": [{"type": "conv2d_layer"}, {"type": "logistic_regression"}],
        }
    ]
    result = validate(nodes, [])
    assert result.valid is False
    assert any("Framework mismatch" in e for e in result.errors)


def test_container_accepts_homogeneous_and_transition():
    from mlblock.validation import validate

    nodes = [
        {
            "id": "c1",
            "type": "sequential_container",
            "children": [{"type": "conv2d_layer"}, {"type": "relu_layer"}],
        }
    ]
    result = validate(nodes, [])
    assert not any("Framework mismatch" in e for e in result.errors)

    nodes = [
        {
            "id": "c1",
            "type": "sequential_container",
            "children": [{"type": "conv2d_layer"}, {"type": "to_tensor"}],
        }
    ]
    result = validate(nodes, [])
    assert not any("Framework mismatch" in e for e in result.errors)


def test_generator_injects_mlflow_setup():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    nodes = [
        PipelineNode(
            id="t", type="mlflow_tracker", params={"experiment_name": "exp1"}
        ),
        PipelineNode(id="d", type="load_csv", params={"path": "data.csv"}),
    ]
    code = generate_code(nodes, [])
    assert "mlflow.autolog()" in code
    assert "mlflow.set_experiment(" in code and "exp1" in code
    compile(code, "<generated>", "exec")


def test_generator_without_tracker_has_no_mlflow():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    nodes = [PipelineNode(id="d", type="load_csv", params={"path": "data.csv"})]
    code = generate_code(nodes, [])
    assert "mlflow.autolog()" not in code
    compile(code, "<generated>", "exec")


def test_dropout_legacy_alias_resolves_to_composable_layer():
    from mlblock.blocks.registry import BLOCK_REGISTRY
    from mlblock.catalog import catalog
    from mlblock.core.adapters import resolve_alias

    assert resolve_alias("dropout") == "dropout_layer"
    assert catalog.get("dropout_layer") is not None
    # Legacy name keeps working (params meta preserved through the alias)
    assert BLOCK_REGISTRY["dropout"].params["p"].min == 0.0
    assert BLOCK_REGISTRY["dropout"].params["p"].max == 1.0
