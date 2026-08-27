"""TDD for Validation deep module — interface is the test surface."""
from mlblock.validation import validate


SIMPLE = {
    "nodes": [
        {"id": "input_1", "type": "input", "params": {"shape": [1, 28, 28]}},
        {"id": "conv1", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 32}},
        {"id": "relu1", "type": "relu", "params": {}},
    ],
    "edges": [
        {"source": "input_1", "source_port": "out_1", "target": "conv1", "target_port": "in_1"},
        {"source": "conv1", "source_port": "out_1", "target": "relu1", "target_port": "in_1"},
    ],
}


def test_validate_valid_returns_order():
    r = validate(SIMPLE["nodes"], SIMPLE["edges"])
    assert r.valid is True
    assert r.errors == []
    assert r.order == ["input_1", "conv1", "relu1"]


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
