from __future__ import annotations

import tempfile
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from mlblock.server.database import get_session
from mlblock.server.main import app

_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
test_engine = create_engine(
    f"sqlite:///{_tmp_db.name}", connect_args={"check_same_thread": False}
)


def override_get_session():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session

from mlblock.server.auth import get_current_user
from mlblock.server.gpu_auth import verify_gpu_key

def override_get_current_user():
    return "00000000-0000-0000-0000-000000000000"

def override_verify_gpu_key():
    return "gpu"

app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[verify_gpu_key] = override_verify_gpu_key

@pytest.fixture(autouse=True)
def _setup_db():
    SQLModel.metadata.create_all(test_engine)
    yield
    with Session(test_engine) as session:
        for table in reversed(SQLModel.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()


@pytest.fixture
def client():
    return TestClient(app)


# ── Blocks ──────────────────────────────────────────────────────────


def test_list_blocks_returns_paginated(client: TestClient):
    resp = client.get("/api/blocks")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert data["page"] == 1
    assert data["size"] == 30
    assert data["total"] > 0
    assert len(data["items"]) > 0
    assert "name" in data["items"][0]

def test_list_blocks_filters_by_category(client: TestClient):
    resp = client.get("/api/blocks?category=neural")
    assert resp.status_code == 200
    data = resp.json()
    assert all(item["category"]["name"] == "neural" for item in data["items"])

def test_get_block_by_type(client: TestClient):
    resp = client.get("/api/blocks/conv2d")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "conv2d"
    assert data["category"]["name"] == "neural"
    assert "params" in data
    assert "outputs" in data
    assert "deps" in data


def test_get_block_unknown_returns_404(client: TestClient):
    resp = client.get("/api/blocks/doesnotexist")
    assert resp.status_code == 404


def test_list_categories(client: TestClient):
    resp = client.get("/api/blocks/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    names = [c["name"] for c in data]
    assert "neural" in names
    for cat in data:
        assert "color" in cat
        assert "block_count" in cat
        assert cat["color"].startswith("#")


# ── Pipelines CRUD ──────────────────────────────────────────────────


def test_create_pipeline(client: TestClient):
    resp = client.post(
        "/api/pipelines",
        json={"name": "test_pipeline", "description": "A test pipeline", "nodes": [], "edges": []},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "test_pipeline"
    assert data["description"] == "A test pipeline"
    assert data["id"] is not None
    assert data["node_count"] == 0


def test_create_pipeline_with_graph(client: TestClient):
    nodes = [
        {"id": "conv1", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
        {"id": "relu1", "type": "relu", "params": {}},
    ]
    edges = [
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
    ]
    resp = client.post(
        "/api/pipelines",
        json={"name": "cnn_test", "nodes": nodes, "edges": edges},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["node_count"] == 2
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1


def test_get_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "get_test", "nodes": [], "edges": []},
    ).json()
    pid = create["id"]

    resp = client.get(f"/api/pipelines/{pid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == pid
    assert data["name"] == "get_test"
    assert "node_count" in data
    assert "nodes" in data
    assert "edges" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_get_pipeline_unknown_returns_404(client: TestClient):
    resp = client.get(f"/api/pipelines/{uuid.uuid4()}")
    assert resp.status_code == 404

def test_update_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "before", "nodes": [], "edges": []},
    ).json()
    pid = create["id"]

    nodes = [
        {"id": "fc1", "type": "linear", "params": {"in_features": 10, "out_features": 5}},
    ]
    edges = []
    resp = client.put(
        f"/api/pipelines/{pid}",
        json={"name": "after", "description": "updated", "nodes": nodes, "edges": edges},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "after"
    assert data["description"] == "updated"
    assert data["node_count"] == 1


def test_delete_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "delete_me", "nodes": [], "edges": []},
    ).json()
    pid = create["id"]

    resp = client.delete(f"/api/pipelines/{pid}")
    assert resp.status_code == 204

    resp = client.get(f"/api/pipelines/{pid}")
    assert resp.status_code == 404


def test_list_pipelines_pagination(client: TestClient):
    for i in range(5):
        client.post(
            "/api/pipelines",
            json={"name": f"pipe_{i}", "nodes": [], "edges": []},
        )

    resp = client.get("/api/pipelines?page=1&size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["pages"] == 3

    resp = client.get("/api/pipelines?page=3&size=2")
    data = resp.json()
    assert len(data["items"]) == 1


def test_list_pipelines_search(client: TestClient):
    client.post("/api/pipelines", json={"name": "alpha_net", "nodes": [], "edges": []})
    client.post("/api/pipelines", json={"name": "beta_net", "nodes": [], "edges": []})
    client.post("/api/pipelines", json={"name": "gamma_vae", "nodes": [], "edges": []})

    resp = client.get("/api/pipelines?search=net")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


# ── Validation ──────────────────────────────────────────────────────


def test_validate_valid_graph(client: TestClient):
    nodes = [
        {"id": "conv1", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
        {"id": "relu1", "type": "relu", "params": {}},
    ]
    edges = [
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
    ]
    resp = client.post("/api/validate", json={"nodes": nodes, "edges": edges})
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["errors"] == []


def test_validate_unknown_block_type(client: TestClient):
    nodes = [
        {"id": "foo", "type": "nonexistent_block", "params": {}},
    ]
    resp = client.post("/api/validate", json={"nodes": nodes, "edges": []})
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    errors_str = " ".join(data["errors"]).lower()
    assert "nonexistent_block" in errors_str


def test_validate_cycle(client: TestClient):
    nodes = [
        {"id": "a", "type": "linear", "params": {"in_features": 4, "out_features": 4}},
        {"id": "b", "type": "relu", "params": {}},
    ]
    edges = [
        {"source": "a", "source_port": "out", "target": "b", "target_port": "in"},
        {"source": "b", "source_port": "out", "target": "a", "target_port": "in"},
    ]
    resp = client.post("/api/validate", json={"nodes": nodes, "edges": edges})
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert any("cycle" in e.lower() for e in data["errors"])


# ── Generate ────────────────────────────────────────────────────────


def test_generate_code(client: TestClient):
    nodes = [
        {"id": "conv1", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
        {"id": "relu1", "type": "relu", "params": {}},
    ]
    edges = [
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
    ]
    create = client.post(
        "/api/pipelines",
        json={"name": "code_gen", "nodes": nodes, "edges": edges},
    ).json()
    pid = create["id"]

    resp = client.post(f"/api/pipelines/{pid}/generate")
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert "import torch" in data["code"]
    assert "nn.Conv2d" in data["code"] or "conv2d" in data["code"].lower()


def test_generate_empty_pipeline_returns_400(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "empty", "nodes": [], "edges": []},
    ).json()
    pid = create["id"]

    resp = client.post(f"/api/pipelines/{pid}/generate")
    assert resp.status_code == 400


# ── Build ────────────────────────────────────────────────────────────


def test_build_model(client: TestClient):
    """Graph with only BUILD-capable blocks (no 'input' block)."""
    nodes = [
        {"id": "conv1", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
        {"id": "relu1", "type": "relu", "params": {}},
        {"id": "flat1", "type": "flatten", "params": {}},
        {"id": "fc1", "type": "linear", "params": {"in_features": 2704, "out_features": 10}},
    ]
    edges = [
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
        {"source": "relu1", "source_port": "out", "target": "flat1", "target_port": "in"},
        {"source": "flat1", "source_port": "out", "target": "fc1", "target_port": "in"},
    ]
    create = client.post(
        "/api/pipelines",
        json={"name": "build_test", "nodes": nodes, "edges": edges},
    ).json()
    pid = create["id"]

    resp = client.post(f"/api/pipelines/{pid}/build")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["output_shape"] is not None
    assert len(data["output_shape"]) > 0
    assert data["output_shape"] == [1, 10]
    assert data["layer_count"] == 4
    assert data["error"] is None


def test_build_pipeline_with_unbuildable_block(client: TestClient):
    """Graph containing a block without BUILD function should 400."""
    nodes = [
        {"id": "inp1", "type": "input", "params": {"shape": [1, 28, 28]}},
    ]
    create = client.post(
        "/api/pipelines",
        json={"name": "unbuildable_test", "nodes": nodes, "edges": []},
    ).json()
    pid = create["id"]

    resp = client.post(f"/api/pipelines/{pid}/build")
    assert resp.status_code == 400
