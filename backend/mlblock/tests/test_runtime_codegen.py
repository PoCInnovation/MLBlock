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
