from __future__ import annotations

import os
import uuid

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

load_dotenv()

from mlblock.server.main import app


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


# ── Health ──────────────────────────────────────────────────────────

def test_health_endpoint(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["run_mode"] in ("local", "gpu")


# ── Projets (persistance) ───────────────────────────────────────────

def test_create_draft_not_listed(client: TestClient):
    resp = client.post(
        "/api/pipelines",
        json={"name": "brouillon", "is_draft": True, "nodes": [], "edges": []},
    )
    assert resp.status_code == 201
    assert resp.json()["is_draft"] is True
    listing = client.get("/api/pipelines").json()
    assert listing["total"] == 0


def test_save_formalizes_draft(client: TestClient):
    created = client.post(
        "/api/pipelines",
        json={"name": "brouillon", "is_draft": True, "nodes": [], "edges": []},
    ).json()
    resp = client.put(
        f"/api/pipelines/{created['id']}",
        json={"name": "Mon projet", "is_draft": False},
    )
    assert resp.status_code == 200
    assert resp.json()["is_draft"] is False
    listing = client.get("/api/pipelines").json()
    assert listing["total"] == 1
    assert listing["items"][0]["name"] == "Mon projet"


def test_only_one_draft_per_user(client: TestClient):
    first = client.post(
        "/api/pipelines",
        json={"name": "brouillon", "is_draft": True, "nodes": [], "edges": []},
    ).json()
    second = client.post(
        "/api/pipelines",
        json={"name": "brouillon", "is_draft": True, "nodes": [], "edges": []},
    ).json()
    assert second["id"] != first["id"]
    assert client.get(f"/api/pipelines/{first['id']}").status_code == 404
    assert client.get(f"/api/pipelines/{second['id']}").status_code == 200


def test_20_projects_limit_returns_409(client: TestClient):
    for i in range(20):
        resp = client.post(
            "/api/pipelines",
            json={"name": f"projet_{i}", "nodes": [], "edges": []},
        )
        assert resp.status_code == 201
    resp = client.post(
        "/api/pipelines",
        json={"name": "trop", "nodes": [], "edges": []},
    )
    assert resp.status_code == 409
    assert "20 projets" in resp.json()["detail"]
    # Un brouillon reste permis au-delà du plafond
    draft = client.post(
        "/api/pipelines",
        json={"name": "brouillon", "is_draft": True, "nodes": [], "edges": []},
    )
    assert draft.status_code == 201


def test_drafts_not_counted_toward_limit(client: TestClient):
    for i in range(20):
        client.post("/api/pipelines", json={"name": f"p{i}", "nodes": [], "edges": []})
    client.post("/api/pipelines", json={"name": "b", "is_draft": True, "nodes": [], "edges": []})
    # 20 projets + 1 brouillon : le brouillon suivant est accepté (cleanup du précédent)
    resp = client.post(
        "/api/pipelines",
        json={"name": "b2", "is_draft": True, "nodes": [], "edges": []},
    )
    assert resp.status_code == 201


def test_position_roundtrip(client: TestClient):
    nodes = [{"id": "n1", "type": "load_csv", "params": {}, "position": {"x": 120.5, "y": 45}}]
    created = client.post(
        "/api/pipelines",
        json={"name": "pos", "nodes": nodes, "edges": []},
    ).json()
    fetched = client.get(f"/api/pipelines/{created['id']}").json()
    assert fetched["nodes"][0]["position"] == {"x": 120.5, "y": 45}


# ── Résultats (visualisation) ───────────────────────────────────────

def test_serialize_output_typed():
    """Le helper émis par le générateur produit des payloads typés."""
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode
    code = generate_code(
        [PipelineNode(id="n1", type="train_model", params={"epochs": "5"})],
        [],
    )
    gl: dict = {}
    src = code.replace('if __name__ == "__main__":\n    main()', "")
    exec(compile(src, "<gen>", "exec"), gl)
    s = gl["_serialize_output"]
    assert s(b"\x89PNG\r\n") == {"type": "image", "mime": "image/png", "data": "iVBORw0K"}
    assert s([0.9, 0.5]) == {"type": "curve", "points": [0.9, 0.5]}
    assert s({"model": object(), "history": [1.2, 0.8]}) == {"type": "curve", "points": [1.2, 0.8]}
    assert s({"mse": 0.02, "note": "ok"}) == {"type": "metrics", "values": {"mse": 0.02, "note": "ok"}}
    assert s(0.5) == {"type": "metric", "value": 0.5}
    assert s("hello") == {"type": "text", "text": "hello"}


def test_job_outputs_endpoint(client: TestClient, monkeypatch):
    monkeypatch.setenv("BACKEND_TIMEOUT", "2")  # subprocess mock : callbacks échouent vite
    created = client.post(
        "/api/pipelines",
        json={"name": "viz", "nodes": [], "edges": []},
    ).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    job_id = job["id"]
    # Sortie structurée stockée telle quelle (pas de troncature backend)
    push = client.post(
        f"/api/jobs/{job_id}/output",
        json={"block": "train_model", "output": '{"type":"curve","points":[1.2,0.8,0.4]}'},
    )
    assert push.status_code == 200
    out = client.get(f"/api/jobs/{job_id}/outputs")
    assert out.status_code == 200
    rows = out.json()
    assert len(rows) == 1
    assert rows[0]["block_name"] == "train_model"
    assert rows[0]["output"] == '{"type":"curve","points":[1.2,0.8,0.4]}'


def test_create_rejects_unknown_block_type(client: TestClient):
    resp = client.post(
        "/api/pipelines",
        json={"name": "x", "nodes": [{"id": "n1", "type": "bloc_bidon", "params": {}}], "edges": []},
    )
    assert resp.status_code == 400
    assert "bloc_bidon" in resp.json()["detail"]
    assert client.get("/api/pipelines").json()["total"] == 0
