from __future__ import annotations

from mlblock.core.advisor import analyze_pipeline


def test_empty_pipeline():
    res = analyze_pipeline([], [])
    assert res.score == 0
    assert res.level == "Vide"


def test_pipeline_without_eval():
    nodes = [
        {"id": "n1", "type": "load_csv"},
        {"id": "n2", "type": "logistic_regression"},
    ]
    edges = [{"source": "n1", "target": "n2", "source_port": "out_1", "target_port": "in_1"}]
    res = analyze_pipeline(nodes, edges)
    assert res.score < 60
    assert any("évaluation" in imp for imp in res.improvements)
    assert any("Normalisation absente" in imp for imp in res.improvements)


def test_pipeline_with_scaler_and_eval():
    nodes = [
        {"id": "n1", "type": "load_csv"},
        {"id": "n2", "type": "standard_scaler"},
        {"id": "n3", "type": "train_test_split"},
        {"id": "n4", "type": "logistic_regression"},
        {"id": "n5", "type": "confusion_matrix"},
    ]
    edges = []
    res = analyze_pipeline(nodes, edges)
    assert res.score >= 80
    assert "Expert" in res.level or "Avancé" in res.level
    assert any("standardisées" in s for s in res.strengths)
    assert any("Évaluation connectée" in s for s in res.strengths)


def test_neural_linear_without_activation():
    nodes = [
        {"id": "n1", "type": "linear_layer"},
        {"id": "n2", "type": "linear_layer"},
    ]
    res = analyze_pipeline(nodes, [])
    assert any("Empilement linéaire" in imp for imp in res.improvements)


def test_api_analyze_pipeline():
    from fastapi.testclient import TestClient
    from mlblock.server.main import app

    client = TestClient(app)
    payload = {
        "nodes": [
            {"id": "n1", "type": "load_csv", "params": {}},
            {"id": "n2", "type": "standard_scaler", "params": {}},
            {"id": "n3", "type": "confusion_matrix", "params": {}},
        ],
        "edges": [],
    }
    resp = client.post("/api/pipelines/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "score" in data
    assert "level" in data
    assert "strengths" in data
