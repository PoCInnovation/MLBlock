import json
import tempfile
from pathlib import Path

import pytest
import pydantic

from mlblock.core.config import ConfigLoader


@pytest.fixture
def valid_json():
    data = {
        "nodes": [
            {
                "id": "input_1",
                "type": "input",
                "params": {"shape": [1, 28, 28]},
            },
            {
                "id": "conv1",
                "type": "conv2d",
                "params": {"in_channels": 1, "out_channels": 32},
            },
        ],
        "edges": [
            {
                "source": "input_1",
                "source_port": "out",
                "target": "conv1",
                "target_port": "in",
            }
        ],
    }
    return data


@pytest.fixture
def valid_json_path(valid_json):
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False
    ) as f:
        json.dump(valid_json, f)
        path = f.name
    yield Path(path)
    Path(path).unlink()


def test_config_loader_load(valid_json_path):
    loader = ConfigLoader(valid_json_path)
    data = loader.load()
    assert "nodes" in data
    assert "edges" in data


def test_config_loader_validate_valid(valid_json):
    loader = ConfigLoader("dummy.json")
    loader.validate(valid_json)


def test_config_loader_validate_missing_nodes():
    loader = ConfigLoader("dummy.json")
    with pytest.raises(pydantic.ValidationError):
        loader.validate({"edges": []})


def test_config_loader_validate_missing_edges():
    loader = ConfigLoader("dummy.json")
    with pytest.raises(pydantic.ValidationError):
        loader.validate({"nodes": []})


def test_config_loader_validate_node_without_id():
    loader = ConfigLoader("dummy.json")
    with pytest.raises(pydantic.ValidationError):
        loader.validate(
            {
                "nodes": [{"type": "conv2d"}],
                "edges": [],
            }
        )


def test_config_loader_validate_edge_without_key():
    loader = ConfigLoader("dummy.json")
    with pytest.raises(pydantic.ValidationError):
        loader.validate(
            {
                "nodes": [{"id": "a", "type": "conv2d"}],
                "edges": [{"source_port": "out", "target": "a", "target_port": "in"}],
            }
        )


def test_config_loader_unsupported_format():
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".yaml", delete=False
    ) as f:
        f.write("hello")
        path = f.name
    loader = ConfigLoader(Path(path))
    with pytest.raises(ValueError, match="Unsupported config format"):
        loader.load()
    Path(path).unlink()
