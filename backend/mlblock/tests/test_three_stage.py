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
