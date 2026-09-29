from __future__ import annotations

import json
import re
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

EXOS_DIR = Path(__file__).resolve().parent.parent / "configs" / "exos"

PATTERN_BY_PREFIX: dict[str, str] = {
    "A1": "cnn",
    "A2": "cnn",
    "A3": "deep-learning",
    "A4": "deep-learning",
    "A5": "cnn",
    "A6": "nlp",
    "A7": "timeseries",
    "B1": "classification",
    "B2": "clustering",
    "B3": "clustering",
    "C1": "rl",
    "C2": "rl",
}


def layout_dag(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    """Compute deterministic (x, y) 2D layered layout for DAG nodes."""
    node_ids = [n["id"] for n in nodes]
    preds: dict[str, list[str]] = {nid: [] for nid in node_ids}
    succs: dict[str, list[str]] = {nid: [] for nid in node_ids}
    in_deg: dict[str, int] = {nid: 0 for nid in node_ids}

    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s in preds and t in preds and s != t:
            preds[t].append(s)
            succs[s].append(t)
            in_deg[t] = in_deg.get(t, 0) + 1

    # Topological rank (longest path from source)
    rank: dict[str, int] = {nid: 0 for nid in node_ids}
    queue: deque[str] = deque([nid for nid in node_ids if in_deg[nid] == 0])

    while queue:
        u = queue.popleft()
        for v in succs[u]:
            if rank[u] + 1 > rank[v]:
                rank[v] = rank[u] + 1
            in_deg[v] -= 1
            if in_deg[v] == 0:
                queue.append(v)

    # Group by rank
    by_rank: dict[int, list[str]] = defaultdict(list)
    for nid in node_ids:
        by_rank[rank[nid]].append(nid)

    positions: dict[str, dict[str, float]] = {}
    for r in sorted(by_rank.keys()):
        level_nodes = by_rank[r]
        for idx, nid in enumerate(level_nodes):
            x = 80.0 + idx * 280.0
            y = 80.0 + r * 180.0
            positions[nid] = {"x": x, "y": y}

    return positions


def _load_raw_exos() -> list[dict[str, Any]]:
    if not EXOS_DIR.is_dir():
        return []

    exos = []
    for f in sorted(EXOS_DIR.glob("*.json")):
        stem = f.stem
        m = re.match(r"^([a-zA-Z0-9]+)", stem)
        code = m.group(1).upper() if m else stem.upper()
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue

        raw_nodes = data.get("graph", {}).get("nodes", [])
        raw_edges = data.get("graph", {}).get("edges", [])
        positions = layout_dag(raw_nodes, raw_edges)

        flat_nodes = []
        for n in raw_nodes:
            nid = n.get("id", "")
            flat_nodes.append({
                "id": nid,
                "type": n.get("type", ""),
                "params": n.get("params", {}),
                "position": positions.get(nid, {"x": 100.0, "y": 100.0}),
            })

        flat_edges = []
        for e in raw_edges:
            flat_edges.append({
                "source": e.get("source", ""),
                "source_port": e.get("source_port", "out_1"),
                "target": e.get("target", ""),
                "target_port": e.get("target_port", "in_1"),
            })

        exos.append({
            "id": stem,
            "code": code,
            "name": data.get("name", stem),
            "description": data.get("description", ""),
            "pattern": PATTERN_BY_PREFIX.get(code, "general"),
            "nodes": flat_nodes,
            "edges": flat_edges,
        })
    return exos


_EXOS_CACHE: list[dict[str, Any]] | None = None


def get_exos() -> list[dict[str, Any]]:
    """Return all available reference pipeline templates in flat format with positions."""
    global _EXOS_CACHE
    if _EXOS_CACHE is None:
        _EXOS_CACHE = _load_raw_exos()
    return _EXOS_CACHE


def get_exo(id_or_code: str) -> dict[str, Any] | None:
    """Find an exo template by id or code (case-insensitive)."""
    target = id_or_code.strip().lower()
    for e in get_exos():
        if e["id"].lower() == target or e["code"].lower() == target:
            return e
    return None
