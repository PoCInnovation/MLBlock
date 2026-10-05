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


def test_every_superblock_title_resolves_to_a_block():
    """The audit's key test: no phantom SuperBlock ids in the catalog."""
    from mlblock.catalog import catalog

    missing = [sb["id"] for sb in catalog.superblocks() if catalog.get(sb["id"]) is None]
    assert missing == []


def test_superblock_default_children_validate_clean():
    """Each standard SuperBlock's default children pass container validation."""
    from mlblock.core.superblocks import SUPERBLOCK_DEFS
    from mlblock.validation import validate

    for sb_id, d in SUPERBLOCK_DEFS.items():
        nodes = [{"id": "c1", "type": sb_id, "children": list(d["children"])}]
        result = validate(nodes, [])
        bad = [e for e in result.errors if "Framework mismatch" in e or "Sequential mismatch" in e]
        assert bad == [], f"{sb_id}: {bad}"


def test_declared_container_engine_wins_over_inference():
    """A user-declared engine is enforced instead of the inferred one."""
    from mlblock.validation import validate

    children = [{"type": "logistic_regression"}]
    declared_sklearn = [{"id": "c1", "type": "sequential_container", "engine": "sklearn", "children": children}]
    result = validate(declared_sklearn, [])
    assert not any("Framework mismatch" in e for e in result.errors)

    declared_pytorch = [{"id": "c1", "type": "sequential_container", "engine": "pytorch", "children": children}]
    result = validate(declared_pytorch, [])
    assert any("Framework mismatch" in e for e in result.errors)


def test_mlflow_setup_emitted_exactly_once():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    nodes = [
        PipelineNode(id="t", type="mlflow_tracker", params={"experiment_name": "exp1"}),
        PipelineNode(id="d", type="load_csv", params={"path": "data.csv"}),
    ]
    code = generate_code(nodes, [])
    # Call sites live at 8-space indent inside main(); the inlined block
    # source (4-space indent) must not be counted.
    assert code.count("\n        mlflow.set_experiment(") == 1
    assert code.count("\n        mlflow.autolog()") == 1
    compile(code, "<generated>", "exec")


def test_threaded_container_threads_outputs_into_first_inputs():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    node = PipelineNode(
        id="c1",
        type="tabular_data_pipeline",
        children=[
            PipelineNode(id="c1.load_csv", type="load_csv", params={"path": "d.csv"}),
            PipelineNode(id="c1.standard_scaler", type="standard_scaler", params={}),
        ],
    )
    code = generate_code([node], [])
    assert "standard_scaler(in_1=out_1)" in code
    assert "nn.Sequential" not in code
    compile(code, "<generated>", "exec")


def test_tabular_superblock_end_to_end(tmp_path):
    """Generated tabular pipeline actually runs in-process."""
    import pandas as pd
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    csv_path = tmp_path / "data.csv"
    pd.DataFrame({"a": [1.0, 2.0, 3.0, 4.0], "b": [10.0, 20.0, 30.0, 40.0]}).to_csv(csv_path, index=False)
    node = PipelineNode(
        id="c1",
        type="tabular_data_pipeline",
        children=[
            PipelineNode(id="c1.load_csv", type="load_csv", params={"path": str(csv_path)}),
            PipelineNode(id="c1.standard_scaler", type="standard_scaler", params={}),
        ],
    )
    code = generate_code([node], [])
    namespace: dict = {"__name__": "__main__"}
    # main() runs fully: any wiring/name/param error would raise here
    # (notify_* callbacks fail silently without a server, then it re-raises).
    exec(compile(code, "<generated>", "exec"), namespace)  # noqa: S102 -- tested generated code
    # Same chain, direct calls, to assert on values.
    import importlib.util
    from pathlib import Path

    blocks_dir = Path(__file__).resolve().parent.parent / "blocks"

    def _load(mod_name: str, file_name: str):
        spec = importlib.util.spec_from_file_location(
            mod_name, blocks_dir / file_name
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    load_csv = _load("lc", "donnees-22C55E/load_csv.py").load_csv
    scaler = _load("sc", "modeles-F59E0B/standard_scaler.py").standard_scaler
    out = scaler(load_csv(str(csv_path)))
    assert list(out.columns) == ["a", "b"]
    assert abs(out["a"].mean()) < 1e-9


def test_exporter_block_saves_model(tmp_path, monkeypatch):
    from pathlib import Path

    from sklearn.linear_model import LogisticRegression

    monkeypatch.chdir(tmp_path)
    import importlib.util

    block_file = (
        Path(__file__).resolve().parent.parent
        / "blocks"
        / "entrainement-DE497D"
        / "mlflow_model_exporter.py"
    )
    spec = importlib.util.spec_from_file_location("exporter_mod", block_file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    model = LogisticRegression(max_iter=1000).fit([[0.0], [1.0]], [0, 1])
    path = mod.mlflow_model_exporter(model, artifact_path="model")
    assert (tmp_path / path / "MLmodel").exists()


def test_no_ghost_convolution_mapping():
    from mlblock.core.stages import ENGINE_OF_CATEGORY, MACRO_OF_CATEGORY

    assert "convolution" not in MACRO_OF_CATEGORY
    assert "convolution" not in ENGINE_OF_CATEGORY
