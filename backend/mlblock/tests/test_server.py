from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Ensure SQLite fallback — must be set before any database imports
os.environ.pop("DATABASE_URL", None)

from mlblock.server.main import app
from mlblock.server.database import get_session
from mlblock.server.auth import get_current_user
from mlblock.server.gpu_auth import verify_gpu_key


@pytest.fixture(name="client")
def client_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    test_user_id = str(uuid.uuid4())
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = lambda: test_user_id
    app.dependency_overrides[verify_gpu_key] = lambda: "gpu"

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# ── Blocks ──────────────────────────────────────────────────────────


def test_list_blocks_returns_paginated(client: TestClient):
    resp = client.get("/api/blocks?page=1&size=20")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["size"] == 20


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


def test_get_block_unknown_returns_404(client: TestClient):
    resp = client.get("/api/blocks/doesnotexist")
    assert resp.status_code == 404


def test_list_categories(client: TestClient):
    resp = client.get("/api/blocks/categories")
    assert resp.status_code == 200
    cats = resp.json()
    names = [c["name"] for c in cats]
    assert "neural" in names


# ── Pipelines CRUD ─────────────────────────────────────────────────


def test_create_pipeline(client: TestClient):
    resp = client.post(
        "/api/pipelines",
        json={"name": "test", "nodes": [], "edges": []},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "test"
    assert data["node_count"] == 0


def test_create_pipeline_with_graph(client: TestClient):
    nodes = [
        {"id": "n1", "type": "input", "params": {"shape": [1, 28, 28]}},
        {"id": "n2", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
    ]
    edges = [
        {"source": "n1", "source_port": "out_1", "target": "n2", "target_port": "in_1"},
    ]
    resp = client.post(
        "/api/pipelines",
        json={"name": "graph_test", "nodes": nodes, "edges": edges},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["node_count"] == 2
    assert len(data["edges"]) == 1


def test_get_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "get_test", "nodes": [], "edges": []},
    ).json()
    resp = client.get(f"/api/pipelines/{create['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "get_test"
    assert "node_count" in data


def test_get_pipeline_unknown_returns_404(client: TestClient):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/pipelines/{fake_id}")
    assert resp.status_code == 404


def test_update_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "old_name", "nodes": [], "edges": []},
    ).json()
    resp = client.put(
        f"/api/pipelines/{create['id']}",
        json={"name": "new_name"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "new_name"
    assert data["node_count"] == 0


def test_delete_pipeline(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "to_delete", "nodes": [], "edges": []},
    ).json()
    resp = client.delete(f"/api/pipelines/{create['id']}")
    assert resp.status_code == 204
    resp = client.get(f"/api/pipelines/{create['id']}")
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


def test_list_pipelines_search(client: TestClient):
    client.post(
        "/api/pipelines",
        json={"name": "searchable_pipeline", "nodes": [], "edges": []},
    )
    client.post(
        "/api/pipelines",
        json={"name": "other", "nodes": [], "edges": []},
    )
    resp = client.get("/api/pipelines?search=searchable")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "searchable_pipeline"


# ── Validation ──────────────────────────────────────────────────────


def test_validate_valid_graph(client: TestClient):
    resp = client.post(
        "/api/validate",
        json={
            "nodes": [
                {"id": "n1", "type": "input", "params": {"shape": [1, 28, 28]}},
                {"id": "n2", "type": "relu", "params": {}},
            ],
            "edges": [
                {"source": "n1", "source_port": "out_1", "target": "n2", "target_port": "in_1"},
            ],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["errors"] == []


def test_validate_unknown_block_type(client: TestClient):
    resp = client.post(
        "/api/validate",
        json={
            "nodes": [{"id": "n1", "type": "nonexistent", "params": {}}],
            "edges": [],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False


def test_validate_cycle(client: TestClient):
    resp = client.post(
        "/api/validate",
        json={
            "nodes": [
                {"id": "n1", "type": "relu", "params": {}},
                {"id": "n2", "type": "relu", "params": {}},
            ],
            "edges": [
                {"source": "n1", "source_port": "out_1", "target": "n2", "target_port": "in_1"},
                {"source": "n2", "source_port": "out_1", "target": "n1", "target_port": "in_1"},
            ],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False


# ── Code Generation ────────────────────────────────────────────────


def test_generate_code(client: TestClient):
    nodes = [
        {"id": "n1", "type": "input", "params": {"shape": [1, 28, 28]}},
        {"id": "n2", "type": "conv2d", "params": {"in_channels": 1, "out_channels": 4, "kernel_size": 3}},
    ]
    edges = [
        {"source": "n1", "source_port": "out_1", "target": "n2", "target_port": "in_1"},
    ]
    create = client.post(
        "/api/pipelines",
        json={"name": "gen_test", "nodes": nodes, "edges": edges},
    ).json()
    resp = client.post(f"/api/pipelines/{create['id']}/generate")
    assert resp.status_code == 200
    code = resp.json()["code"]
    assert "import" in code
    assert "torch" in code


def test_generate_empty_pipeline_returns_400(client: TestClient):
    create = client.post(
        "/api/pipelines",
        json={"name": "empty", "nodes": [], "edges": []},
    ).json()
    resp = client.post(f"/api/pipelines/{create['id']}/generate")
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
        {"source": "conv1", "source_port": "out_1", "target": "relu1", "target_port": "in_1"},
        {"source": "relu1", "source_port": "out_1", "target": "flat1", "target_port": "in_1"},
        {"source": "flat1", "source_port": "out_1", "target": "fc1", "target_port": "in_1"},
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


def test_build_pipeline_with_unbuildable_block(client: TestClient):
    """Pipeline with 'input' block (no builder) should fail gracefully."""
    nodes = [
        {"id": "n1", "type": "input", "params": {"shape": [1, 28, 28]}},
    ]
    edges = []
    create = client.post(
        "/api/pipelines",
        json={"name": "unbuildable", "nodes": nodes, "edges": edges},
    ).json()
    pid = create["id"]
    resp = client.post(f"/api/pipelines/{pid}/build")
    assert resp.status_code == 400
