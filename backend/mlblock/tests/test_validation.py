"""TDD for Validation deep module — interface is the test surface."""
from mlblock.validation import validate


SIMPLE = {
    "nodes": [
        {"id": "conv1", "type": "conv2d_layer", "params": {"in_channels": 1, "out_channels": 32}},
        {"id": "relu1", "type": "relu_layer", "params": {}},
    ],
    "edges": [
        {"source": "conv1", "source_port": "out_1", "target": "relu1", "target_port": "in_1"},
    ],
}


def test_validate_valid_returns_order():
    r = validate(SIMPLE["nodes"], SIMPLE["edges"])
    assert r.valid is True
    assert r.errors == []
    assert r.order == ["conv1", "relu1"]


def test_validate_resolves_legacy_aliases():
    r = validate(
        [
            {"id": "c", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 32}},
            {"id": "r", "type": "relu", "params": {}},
        ],
        [{"source": "c", "source_port": "out_1", "target": "r", "target_port": "in_1"}],
    )
    assert r.valid is True
    assert r.errors == []
    assert r.order == ["c", "r"]


def test_validate_cycle():
    r = validate(
        [{"id": "a", "type": "relu", "params": {}}, {"id": "b", "type": "relu", "params": {}}],
        [
            {"source": "a", "source_port": "out_1", "target": "b", "target_port": "in_1"},
            {"source": "b", "source_port": "out_1", "target": "a", "target_port": "in_1"},
        ],
    )
    assert r.valid is False
    assert any("cycle" in e.lower() for e in r.errors)


def test_validate_unknown_block():
    r = validate([{"id": "x", "type": "nope_block", "params": {}}], [])
    assert r.valid is False
    assert any("Unknown block" in e for e in r.errors)


def test_validate_port_not_found():
    r = validate(
        [{"id": "a", "type": "relu", "params": {}}, {"id": "b", "type": "relu", "params": {}}],
        [{"source": "a", "source_port": "bad_port", "target": "b", "target_port": "in_1"}],
    )
    assert r.valid is False
    assert any("Port" in e for e in r.errors)


def test_validate_stage_mismatch():
    # Connecting Stage 3 (train_epoch) to Stage 0 (load_csv) must trigger Stage mismatch
    r = validate(
        [
            {"id": "trainer", "type": "train_epoch", "params": {}},
            {"id": "data", "type": "load_csv", "params": {}},
        ],
        [{"source": "trainer", "source_port": "out_1", "target": "data", "target_port": "in_1"}],
    )
    assert r.valid is False
    assert any(
        "Stage mismatch: cannot connect Stage 3 (trainer) to Stage 0 (data)." in e
        for e in r.errors
    )


def test_validate_permitted_feedback_loop():
    # Loop from Stage 3 (TRAIN) to Stage 1 (PREPARE e.g. normalize) is permitted
    r = validate(
        [
            {"id": "trainer", "type": "train_epoch", "params": {}},
            {"id": "prep", "type": "normalize", "params": {}},
        ],
        [{"source": "trainer", "source_port": "out_1", "target": "prep", "target_port": "in_1"}],
    )
    # Stage mismatch should NOT be present (even if port/dtype mismatch might be checked)
    assert not any("Stage mismatch" in e for e in r.errors)


def test_validate_forward_cross_stages():
    # S0 (load_sklearn_dataset) -> S2 (logistic_regression) -> S4 (evaluate) is completely valid
    r = validate(
        [
            {"id": "data", "type": "load_sklearn_dataset", "params": {}},
            {"id": "model", "type": "logistic_regression", "params": {}},
            {"id": "eval", "type": "evaluate", "params": {}},
        ],
        [
            {"source": "data", "source_port": "out_1", "target": "model", "target_port": "train_data"},
            {"source": "model", "source_port": "out_1", "target": "eval", "target_port": "model"},
        ],
    )
    assert not any("Stage mismatch" in e for e in r.errors)


def test_validate_type_mismatch_enhanced_suggestion():
    # Connecting incompatible ports where a converter is known suggests the converter
    from mlblock.catalog import catalog

    r = validate(
        [
            {"id": "csv", "type": "load_csv", "params": {}},
            {"id": "tens", "type": "to_tensor", "params": {}},
        ],
        [{"source": "csv", "source_port": "out_1", "target": "tens", "target_port": "in_1"}],
        registry={
            "load_csv": catalog.get("load_csv"),
            "to_tensor": catalog.get("to_tensor"),
        },
    )
    assert r.valid is False
    assert any("Type mismatch" in e for e in r.errors)
    assert any("Astuce : insérez un Block df_to_tensor" in e for e in r.errors)


def test_validate_stage_world_isolation():
    # Connecting between Stage.WORLD and non-WORLD is rejected as a Stage mismatch
    # 1. Non-world to world (e.g. S0 -> SX)
    r1 = validate(
        [
            {"id": "data", "type": "load_csv", "params": {}},
            {"id": "env", "type": "evaluate_agent", "params": {}},
        ],
        [{"source": "data", "source_port": "out_1", "target": "env", "target_port": "in_1"}],
    )
    assert r1.valid is False
    assert any("Stage.WORLD is isolated from tensor stages" in e for e in r1.errors)

    # 2. World to non-world (e.g. SX -> S2)
    r2 = validate(
        [
            {"id": "env", "type": "create_env", "params": {}},
            {"id": "fc", "type": "linear_layer", "params": {}},
        ],
        [{"source": "env", "source_port": "out_1", "target": "fc", "target_port": "in_1"}],
    )
    assert r2.valid is False
    assert any("Stage.WORLD is isolated from tensor stages" in e for e in r2.errors)

    # 3. World to World is allowed (e.g. SX -> SX)
    r3 = validate(
        [
            {"id": "env", "type": "create_env", "params": {}},
            {"id": "agent", "type": "q_learning", "params": {}},
        ],
        [{"source": "env", "source_port": "out_1", "target": "agent", "target_port": "in_1"}],
    )
    assert not any("Stage mismatch" in e for e in r3.errors)
