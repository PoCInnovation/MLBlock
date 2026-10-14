"""Runtime & codegen reliability (openspec fix-backend-runtime-codegen).

Behavioral tests: generated scripts must compile, fixed blocks must run,
LocalBackend must relay BACKEND_URL.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


def _load_block(relative_path: str, func_name: str):
    base = Path(__file__).resolve().parent.parent / "blocks"
    spec = importlib.util.spec_from_file_location(f"probe_{func_name}", base / relative_path)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, func_name)


def _exo_graphs() -> list[tuple[str, dict, dict]]:
    exos_dir = Path(__file__).resolve().parent.parent / "configs" / "exos"
    out = []
    for f in sorted(exos_dir.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        graph = data.get("graph", data)
        out.append((f.stem, graph.get("nodes", []), graph.get("edges", [])))
    assert len(out) == 12, f"expected 12 canonical exercises, got {len(out)}"
    return out


def test_generated_code_starts_with_future_import():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode

    nodes = [PipelineNode(id="c", type="conv2d_layer", params={"in_channels": 3, "out_channels": 8})]
    code = generate_code(nodes, [])
    assert code.splitlines()[0] == "from __future__ import annotations"
    assert code.count("from __future__ import annotations") == 1
    compile(code, "<generated>", "exec")


def test_all_canonical_exercises_compile():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    for stem, nodes, edges in _exo_graphs():
        p_nodes = [PipelineNode(**n) for n in nodes]
        p_edges = [PipelineEdge(**e) for e in edges]
        code = generate_code(p_nodes, p_edges)
        compile(code, f"<{stem}>", "exec")


def test_pooling_blocks_run_without_attribute_error():
    import torch

    avgpool2d = _load_block("regroupement-F59E0B/avgpool2d.py", "avgpool2d")
    out = avgpool2d(torch.randn(1, 4, 8, 8), kernel_size=2)
    assert tuple(out.shape) == (1, 4, 4, 4)

    adaptive_avg = _load_block("regroupement-F59E0B/adaptive_avgpool2d.py", "adaptive_avgpool2d")
    out = adaptive_avg(torch.randn(1, 4, 8, 8), output_size=4)
    assert tuple(out.shape) == (1, 4, 4, 4)

    adaptive_max = _load_block("regroupement-F59E0B/adaptive_maxpool2d.py", "adaptive_maxpool2d")
    out = adaptive_max(torch.randn(1, 4, 8, 8), output_size=2)
    assert tuple(out.shape) == (1, 4, 2, 2)


def test_recurrent_blocks_run_without_attribute_error():
    import torch

    x = torch.randn(2, 5, 16)
    lstm = _load_block("sequences-8B5CF6/lstm.py", "lstm")
    out, _ = lstm(x, input_size=16, hidden_size=8)
    assert tuple(out.shape) == (2, 5, 8)

    gru = _load_block("sequences-8B5CF6/gru.py", "gru")
    out, _ = gru(x, input_size=16, hidden_size=8)
    assert tuple(out.shape) == (2, 5, 8)

    rnn = _load_block("sequences-8B5CF6/rnn.py", "rnn")
    out, _ = rnn(x, input_size=16, hidden_size=8)
    assert tuple(out.shape) == (2, 5, 8)


def test_multihead_attention_self_attention_call():
    import torch

    mha = _load_block("sequences-8B5CF6/multihead_attention.py", "multihead_attention")
    # Must not raise TypeError about missing key/value (self-attention).
    out, weights = mha(torch.randn(2, 4, 8), embed_dim=8, num_heads=2)
    assert tuple(out.shape) == (2, 4, 8)
    assert tuple(weights.shape) == (2, 4, 4)


def test_local_backend_relays_backend_url_env(monkeypatch):
    from unittest.mock import patch

    from mlblock.execution import LocalBackend

    captured: dict = {}

    class FakePopen:
        def __init__(self, *args, **kwargs):
            captured.update(kwargs.get("env", {}))

    monkeypatch.setenv("BACKEND_URL", "http://custom:9000")
    with patch("mlblock.execution.subprocess.Popen", FakePopen):
        LocalBackend().launch("print('hi')", "00000000-0000-0000-0000-000000000000")
    assert captured["BACKEND_URL"] == "http://custom:9000"

    monkeypatch.delenv("BACKEND_URL", raising=False)
    captured.clear()
    with patch("mlblock.execution.subprocess.Popen", FakePopen):
        LocalBackend().launch("print('hi')", "00000000-0000-0000-0000-000000000000")
    assert captured["BACKEND_URL"] == "http://localhost:8000"


def test_generated_iris_pipeline_runs_end_to_end(monkeypatch):
    """Exo b1 : le code généré s'exécute vraiment et produit une accuracy réelle.

    `requests` est stubé (callbacks capturés, zéro HTTP) : seule la logique
    métier des blocs tourne — iris → split → logreg → evaluate.
    """
    import sys
    import types

    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    for stem, nodes, edges in _exo_graphs():
        if stem != "b1_iris_logistic_regression":
            continue
        break
    else:
        raise AssertionError("exo b1 introuvable")

    code = generate_code([PipelineNode(**n) for n in nodes], [PipelineEdge(**e) for e in edges])
    compile(code, "<b1_iris>", "exec")

    posts: list[dict] = []

    class FakeResponse:
        def json(self):
            return {}

    fake = types.ModuleType("requests")
    fake.post = lambda url, **kw: posts.append({"url": url, **kw}) or FakeResponse()  # type: ignore
    fake.get = lambda url, **kw: FakeResponse()  # type: ignore
    monkeypatch.setitem(sys.modules, "requests", fake)

    mod = types.ModuleType("gen_b1")
    exec(compile(code, "<b1_iris>", "exec"), mod.__dict__)
    mod.main()  # type: ignore

    done = {p["json"]["block"] for p in posts if p["url"].endswith("/status") and p["json"]["status"] == "done"}
    assert {"load_sklearn_dataset", "train_test_split", "logistic_regression", "evaluate", "pipeline"} <= done

    eval_out = [p["json"]["output"] for p in posts if p["url"].endswith("/output") and p["json"]["block"] == "evaluate"]
    inner = json.loads(eval_out[-1])
    if inner.get("type") == "gzip":
        import base64
        import gzip

        inner = json.loads(gzip.decompress(base64.b64decode(inner["data"])).decode())
    acc = inner["values"]["accuracy"] if inner["type"] == "metrics" else inner["value"]
    assert acc > 0.9, f"accuracy iris/logreg attendue > 0.9, eu {acc}"


def _exec_b1_with_stub(monkeypatch, post):
    import sys
    import types

    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    for stem, nodes, edges in _exo_graphs():
        if stem != "b1_iris_logistic_regression":
            continue
        break
    else:
        raise AssertionError("exo b1 introuvable")
    code = generate_code([PipelineNode(**n) for n in nodes], [PipelineEdge(**e) for e in edges])
    compile(code, "<b1_iris>", "exec")

    class FakeResponse:
        def json(self):
            return {}

    fake = types.ModuleType("requests")
    fake.post = post  # type: ignore
    fake.get = lambda url, **kw: FakeResponse()  # type: ignore
    monkeypatch.setitem(sys.modules, "requests", fake)
    mod = types.ModuleType("gen_b1_retry")
    exec(compile(code, "<b1_iris>", "exec"), mod.__dict__)
    return mod


def test_pipeline_done_callback_retries_on_transient_failure(monkeypatch):
    """Le callback terminal done survit à un échec transitoire (sinon job
    coincé en running + instance auto-détruite = cas observé en live)."""
    import sys
    import types

    posts: list[dict] = []
    calls = {"n": 0}

    class FakeResponse:
        def json(self):
            return {}

    def flaky(url, **kw):
        posts.append({"url": url, **kw})
        if (
            url.endswith("/status")
            and kw.get("json", {}).get("block") == "pipeline"
            and kw.get("json", {}).get("status") == "done"
        ):
            calls["n"] += 1
            if calls["n"] == 1:
                raise ConnectionError("blip")
        return FakeResponse()

    fake = types.ModuleType("requests")
    fake.post = flaky  # type: ignore
    fake.get = lambda url, **kw: FakeResponse()  # type: ignore
    monkeypatch.setitem(sys.modules, "requests", fake)
    monkeypatch.setattr("time.sleep", lambda s: None)

    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    for stem, nodes, edges in _exo_graphs():
        if stem != "b1_iris_logistic_regression":
            continue
        break
    code = generate_code([PipelineNode(**n) for n in nodes], [PipelineEdge(**e) for e in edges])
    mod = types.ModuleType("gen_b1_retry")
    exec(compile(code, "<b1_iris>", "exec"), mod.__dict__)
    mod.main()  # type: ignore
    assert calls["n"] >= 2, "done pipeline non re-tenté après échec transitoire"


def test_notify_error_retries_on_transient_failure(monkeypatch):
    posts: list[dict] = []
    calls = {"n": 0}

    def flaky(url, **kw):
        posts.append({"url": url, **kw})
        if url.endswith("/error"):
            calls["n"] += 1
            if calls["n"] == 1:
                raise ConnectionError("blip")
        from unittest.mock import MagicMock

        return MagicMock()

    mod = _exec_b1_with_stub(monkeypatch, flaky)
    monkeypatch.setattr("time.sleep", lambda s: None)
    mod.notify_error("pipeline", ValueError("boom"))  # type: ignore
    assert calls["n"] >= 2, "error pipeline non re-tenté après échec transitoire"


def test_generated_mnist_pipeline_runs_end_to_end_cpu(monkeypatch):
    """Exo 5.2 (chemin template CUDA) : le code généré tourne vraiment en local
    CPU — si le hang live vient du code, ce test le reproduit sans dépenser."""
    import sys
    import types

    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    nodes = [
        {"id": "n1", "type": "load_torch_dataset", "params": {"name": "mnist", "batch_size": "512"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
        {"id": "n2", "type": "flatten_layer", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n3", "type": "linear_layer", "params": {"in_features": "784", "out_features": "10"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
        {"id": "n4", "type": "adam", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n5", "type": "cross_entropy_loss", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n6", "type": "train_model", "params": {"epochs": "1"}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n7", "type": "data_loader", "params": {"batch_size": "512"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
    ]
    edges = [
        {"source": "n1", "source_port": "out_1", "target": "n7", "target_port": "in_1"},
        {"source": "n7", "source_port": "out_1", "target": "n6", "target_port": "in_2"},
        {"source": "n2", "source_port": "out_1", "target": "n3", "target_port": "in_1"},
        {"source": "n3", "source_port": "out_1", "target": "n6", "target_port": "in_1"},
        {"source": "n3", "source_port": "out_1", "target": "n4", "target_port": "in_1"},
        {"source": "n4", "source_port": "out_1", "target": "n6", "target_port": "in_3"},
        {"source": "n5", "source_port": "out_1", "target": "n6", "target_port": "in_4"},
    ]
    code = generate_code([PipelineNode(**n) for n in nodes], [PipelineEdge(**e) for e in edges])
    compile(code, "<mnist>", "exec")
    posts: list[dict] = []

    class FakeResponse:
        def json(self):
            return {}

    fake = types.ModuleType("requests")
    fake.post = lambda url, **kw: posts.append({"url": url, **kw}) or FakeResponse()  # type: ignore
    fake.get = lambda url, **kw: FakeResponse()  # type: ignore
    fake.delete = lambda url, **kw: FakeResponse()  # type: ignore
    monkeypatch.setitem(sys.modules, "requests", fake)
    mod = types.ModuleType("gen_mnist")
    exec(compile(code, "<mnist>", "exec"), mod.__dict__)
    mod.main()  # type: ignore
    done = {p["json"]["block"] for p in posts if p["url"].endswith("/status") and p["json"]["status"] == "done"}
    assert "train_model" in done and "pipeline" in done


def test_train_model_dict_outputs_unpacked_by_key(monkeypatch):
    """train_model retourne un dict : le codegen doit indexer par clé, pas
    déballer (déballer un dict donne les chaînes 'model'/'history')."""
    import base64
    import gzip
    import json as _json
    import sys
    import types

    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineEdge, PipelineNode

    nodes = [
        {"id": "n6", "type": "train_model", "params": {"epochs": "1"}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n1", "type": "load_torch_dataset", "params": {"name": "mnist", "batch_size": "512"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
        {"id": "n7", "type": "data_loader", "params": {"batch_size": "512"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
        {"id": "n2", "type": "flatten_layer", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n3", "type": "linear_layer", "params": {"in_features": "784", "out_features": "10"}, "children": [], "position": {"x": 0, "y": 0}},  # noqa: E501
        {"id": "n4", "type": "adam", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
        {"id": "n5", "type": "cross_entropy_loss", "params": {}, "children": [], "position": {"x": 0, "y": 0}},
    ]
    edges = [
        {"source": "n1", "source_port": "out_1", "target": "n7", "target_port": "in_1"},
        {"source": "n7", "source_port": "out_1", "target": "n6", "target_port": "in_2"},
        {"source": "n2", "source_port": "out_1", "target": "n3", "target_port": "in_1"},
        {"source": "n3", "source_port": "out_1", "target": "n6", "target_port": "in_1"},
        {"source": "n3", "source_port": "out_1", "target": "n4", "target_port": "in_1"},
        {"source": "n4", "source_port": "out_1", "target": "n6", "target_port": "in_3"},
        {"source": "n5", "source_port": "out_1", "target": "n6", "target_port": "in_4"},
    ]
    code = generate_code([PipelineNode(**n) for n in nodes], [PipelineEdge(**e) for e in edges])
    posts: list[dict] = []

    class FakeResponse:
        def json(self):
            return {}

    fake = types.ModuleType("requests")
    fake.post = lambda url, **kw: posts.append({"url": url, **kw}) or FakeResponse()  # type: ignore
    fake.get = lambda url, **kw: FakeResponse()  # type: ignore
    fake.delete = lambda url, **kw: FakeResponse()  # type: ignore
    monkeypatch.setitem(sys.modules, "requests", fake)
    mod = types.ModuleType("gen_mnist_keys")
    exec(compile(code, "<mnist>", "exec"), mod.__dict__)
    mod.main()  # type: ignore
    train_outs = [
        p["json"]["output"] for p in posts
        if p["url"].endswith("/output") and p["json"]["block"] == "train_model"
    ]
    assert train_outs, "aucune sortie train_model"
    texts = []
    for raw in train_outs:
        inner = _json.loads(raw)
        if inner.get("type") == "gzip":
            inner = _json.loads(gzip.decompress(base64.b64decode(inner["data"])).decode())
        texts.append(inner)
    assert not any(t == {"type": "text", "text": "model"} or t == {"type": "text", "text": "history"} for t in texts)
    curves = [t for t in texts if t.get("type") == "curve" and len(t.get("points", [])) == 1]
    assert curves, f"history (1 loss) introuvable : {texts}"
