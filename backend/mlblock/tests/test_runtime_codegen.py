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
    acc = inner["values"]["accuracy"] if inner["type"] == "metrics" else inner["value"]
    assert acc > 0.9, f"accuracy iris/logreg attendue > 0.9, eu {acc}"
