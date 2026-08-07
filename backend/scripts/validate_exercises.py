#!/usr/bin/env python3
"""Validation des exercices — run local via l'API."""
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from dotenv import load_dotenv

load_dotenv()

BASE = "http://localhost:8000"
JWT = os.environ.get("SMOKE_JWT", "")


def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Authorization": f"Bearer {JWT}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def run_exercise(name, nodes, edges):
    """POST pipeline → execute → poll → outputs."""
    status, pipe = api("/api/pipelines", "POST", {"name": name, "is_draft": False, "nodes": nodes, "edges": edges})
    if status != 201:
        print(f"[{name}] CREATE {status}: {pipe}")
        return False
    pid = pipe["id"]
    status, job = api(f"/api/pipelines/{pid}/execute", "POST", {})
    if status != 200:
        print(f"[{name}] EXECUTE {status}: {job}")
        return False
    jid = job["id"]
    for _ in range(90):
        time.sleep(3)
        _, j = api(f"/api/jobs/{jid}")
        if j["status"] in ("done", "error"):
            break
    if j["status"] != "done":
        print(f"[{name}] ÉCHEC: {j.get('error', '')[:200]}")
        return False
    _, outs = api(f"/api/jobs/{jid}/outputs")
    kinds = []
    for o in outs:
        try:
            kinds.append(json.loads(o["output"]).get("type"))
        except Exception:
            kinds.append("?")
    print(f"[{name}] DONE — {len(outs)} sorties {kinds}")
    return True


def nid(i):
    return f"n{i}"


def N(i, t, params=None, pos=None):
    return {"id": nid(i), "type": t, "params": params or {}, "children": [], "position": pos or {"x": i * 240, "y": 100}}


def E(src, tgt, sp="out_1", tp="in_1"):
    return {"source": nid(src), "source_port": sp, "target": nid(tgt), "target_port": tp}


results = {}

# 5.1 Iris : load_sklearn_dataset → train_test_split → random_forest → evaluate
nodes = [N(1, "load_sklearn_dataset", {"name": "iris"}), N(2, "train_test_split", {"ratio": "0.7"}), N(3, "random_forest", {"target_column": "target"}), N(4, "evaluate", {"target_column": "target", "method": "accuracy"})]
edges = [E(1, 2, tp="dataset"), E(2, 3, sp="out_1", tp="train_data"), E(2, 4, sp="out_2", tp="test_data"), E(3, 4, tp="model")]
results["iris"] = run_exercise("ex-iris", nodes, edges)

# 5.3 Clustering : load_sklearn_dataset → kmeans → silhouette
nodes = [N(1, "load_sklearn_dataset", {"name": "iris"}), N(2, "kmeans", {"n_clusters": "3"}), N(3, "silhouette", {})]
edges = [E(1, 2), E(1, 3, tp="in_1"), E(2, 3, tp="model")]
results["clustering"] = run_exercise("ex-clustering", nodes, edges)

# 5.4 NLP : tokenize → build_vocab → encode_text
nodes = [N(1, "tokenize", {"text": "Le chat dort le chat mange", "sep": " "}), N(2, "build_vocab", {}), N(3, "encode_text", {"max_len": "8"})]
edges = [E(1, 2), E(1, 3, tp="in_1"), E(2, 3, tp="vocab")]
results["nlp"] = run_exercise("ex-nlp", nodes, edges)

print(json.dumps(results))

# 5.2 MNIST : load_torch_dataset → train_model(in_2) ; flatten_layer → linear_layer → train_model(in_1) + adam(in_1)
nodes = [N(1, "load_torch_dataset", {"name": "mnist", "batch_size": "512"}), N(2, "flatten_layer", {}), N(3, "linear_layer", {"in_features": "784", "out_features": "10"}), N(4, "adam", {}), N(5, "cross_entropy_loss", {}), N(6, "train_model", {"epochs": "1"})]
edges = [E(1, 6, tp="in_2"), E(2, 3), E(3, 6, tp="in_1"), E(3, 4, tp="in_1"), E(4, 6, tp="in_3"), E(5, 6, tp="in_4")]
results["mnist"] = run_exercise("ex-mnist", nodes, edges)

# 5.5 RL : create_env → q_learning → evaluate_agent
nodes = [N(1, "create_env", {"env_id": "CartPole-v1"}), N(2, "q_learning", {"episodes": "100"}), N(3, "evaluate_agent", {"episodes": "5"})]
edges = [E(1, 2, tp="env"), E(1, 3, tp="env"), E(2, 3, tp="policy")]
results["rl"] = run_exercise("ex-rl", nodes, edges)

# 5.6 Séries : iris → sequence_dataset → train_model(in_2) ; rnn_layer → linear_layer → train_model(in_1) + adam(in_1)
nodes = [N(1, "load_sklearn_dataset", {"name": "iris"}), N(2, "sequence_dataset", {"seq_len": "8"}), N(3, "rnn_layer", {"input_size": "4", "hidden_size": "8"}), N(4, "linear_layer", {"in_features": "8", "out_features": "1"}), N(5, "adam", {}), N(6, "mse_loss", {}), N(7, "train_model", {"epochs": "2"})]
edges = [E(1, 2), E(2, 7, tp="in_2"), E(3, 4), E(4, 7, tp="in_1"), E(4, 5, tp="in_1"), E(5, 7, tp="in_3"), E(6, 7, tp="in_4")]
results["series"] = run_exercise("ex-series", nodes, edges)

print(json.dumps(results, indent=1))
