"""Génère pipelines/demo-poc-vins.json (source unique) puis valide via le backend."""
import json, pathlib
N = lambda i, t, p, x, y: {"id": i, "type": t, "params": p, "children": [], "position": {"x": x, "y": y}}
E = lambda s, sp, t, tp: {"source": s, "source_port": sp, "target": t, "target_port": tp}
T = {"target_column": "target"}
nodes = [
    N("n1", "load_sklearn_dataset", {"name": "wine", "target": "target"}, 60, 260),
    N("n2", "standard_scaler", T, 420, 260),
    N("n3", "train_test_split", {"ratio": 0.7, "seed": 42}, 780, 260),
    N("n4", "random_forest", {**T, "n_estimators": 100}, 1180, 60),
    N("n5", "logistic_regression", T, 1180, 420),
    N("n6", "evaluate", {**T, "method": "accuracy"}, 1580, 60),
    N("n7", "evaluate", {**T, "method": "accuracy"}, 1580, 420),
    N("n8", "confusion_matrix", T, 1580, 240),
    N("n9", "tsne", {"n_components": 2}, 780, 560),
]
edges = [
    E("n1", "out_1", "n2", "in_1"), E("n2", "out_1", "n3", "dataset"),
    E("n3", "out_1", "n4", "train_data"), E("n3", "out_1", "n5", "train_data"),
    E("n3", "out_2", "n6", "test_data"), E("n4", "out_1", "n6", "model"),
    E("n3", "out_2", "n7", "test_data"), E("n5", "out_1", "n7", "model"),
    E("n3", "out_2", "n8", "test_data"), E("n4", "out_1", "n8", "model"),
    E("n2", "out_1", "n9", "in_1"),
]
doc = {"name": "Démo PoC — Classifier des vins", "nodes": nodes, "edges": edges}
out = pathlib.Path(__file__).resolve().parent.parent / "pipelines" / "demo-poc-vins.json"
out.write_text(json.dumps(doc, ensure_ascii=False, indent=2))

from mlblock.validation import validate
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.advisor import analyze_pipeline
bare = [{k: n[k] for k in ("id", "type", "params")} for n in nodes]
r = validate(bare, edges, BLOCK_REGISTRY)
print("valid:", r.valid, "| errors:", r.errors, "| order:", r.order)
a = analyze_pipeline(bare, edges)
print("score IA:", a.score, a.level, "| improvements:", a.improvements)
assert r.valid and a.score >= 80, "pipeline de démo invalide"
