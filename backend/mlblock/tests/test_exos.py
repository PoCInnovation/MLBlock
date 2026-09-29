from __future__ import annotations

from mlblock.core.exos import get_exos, get_exo, layout_dag


def test_get_exos_returns_all_twelve():
    exos = get_exos()
    assert len(exos) == 12
    # Verify required keys
    for e in exos:
        assert "id" in e
        assert "code" in e
        assert "name" in e
        assert "description" in e
        assert "pattern" in e
        assert "nodes" in e
        assert "edges" in e
        # Nodes must have computed position
        for n in e["nodes"]:
            assert "position" in n
            assert "x" in n["position"]
            assert "y" in n["position"]


def test_get_exo_by_id_or_code():
    b3 = get_exo("b3")
    assert b3 is not None
    assert b3["code"] == "B3"
    assert b3["pattern"] == "clustering"
    assert any(n["type"] == "kmeans" for n in b3["nodes"])
    assert any(n["type"] == "tsne" for n in b3["nodes"])

    a1 = get_exo("a1_cifar10_cnn")
    assert a1 is not None
    assert a1["code"] == "A1"
    assert a1["pattern"] == "cnn"



def test_api_list_exos(catalog_client):
    resp = catalog_client.get("/api/exos")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 12
    patterns = {e["pattern"] for e in items}
    assert "clustering" in patterns
    assert "cnn" in patterns
    assert "classification" in patterns


def test_api_filter_exos_by_pattern(catalog_client):
    resp = catalog_client.get("/api/exos?pattern=clustering")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 2
    assert all(e["pattern"] == "clustering" for e in items)


def test_api_get_exo_by_id(catalog_client):
    resp = catalog_client.get("/api/exos/b3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == "B3"
    assert data["name"] == "Iris KMeans — Elbow"

    resp_404 = catalog_client.get("/api/exos/non_existent_exo")
    assert resp_404.status_code == 404

def test_layout_dag_deterministic():
    nodes = [{"id": "a", "type": "load_csv"}, {"id": "b", "type": "kmeans"}]
    edges = [{"source": "a", "source_port": "out_1", "target": "b", "target_port": "in_1"}]
    pos = layout_dag(nodes, edges)
    assert pos["a"]["y"] < pos["b"]["y"]
