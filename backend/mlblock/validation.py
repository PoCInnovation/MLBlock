"""Validation — deep module (single source of truth for pipeline correctness).

Interface is the test surface: validate(pipeline) -> {valid, errors, order}.

Owns what was scattered across:
- core/config.py ConfigLoader.validate (exact string dtype check)
- core/graph.py topological_sort + validate (cycle)
- models/pipeline.py PipelineDef @model_validators (unknown block / port / classify)
- core/types.py family_of / build_conversion_graph / classify + frontend typeCheck.ts

Two adapters are not needed for validation itself — single module — but the
family table is shared with frontend via the same logic (canonical family_of).
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any

from mlblock.core.types import build_conversion_graph, classify  # canonical


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    order: list[str] = field(default_factory=list)


def _topological_sort(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> tuple[list[str], bool]:
    """Kahn deque topo. Returns (order, has_cycle). Internal seam."""
    ids = [n["id"] for n in nodes]
    adj: dict[str, list[str]] = {nid: [] for nid in ids}
    in_deg: dict[str, int] = {nid: 0 for nid in ids}
    for e in edges:
        src, tgt = e["source"], e["target"]
        if src in adj:
            adj[src].append(tgt)
        in_deg[tgt] = in_deg.get(tgt, 0) + 1
        if src not in in_deg:
            in_deg[src] = in_deg.get(src, 0)
    queue: deque[str] = deque([nid for nid, d in in_deg.items() if d == 0 and nid in adj])
    # Also include isolated nodes that have no edges
    for nid in ids:
        if nid not in in_deg or in_deg.get(nid, 0) == 0:
            if nid not in queue and nid in adj:
                queue.append(nid)
    order: list[str] = []
    while queue:
        nid = queue.popleft()
        if nid not in order:
            order.append(nid)
        for nb in adj.get(nid, []):
            in_deg[nb] -= 1
            if in_deg[nb] == 0:
                queue.append(nb)
    has_cycle = len(order) != len(ids)
    return order, has_cycle


def validate(
    nodes: list[dict[str, Any] | Any],
    edges: list[dict[str, Any] | Any],
    registry: dict[str, Any] | None = None,
) -> ValidationResult:
    """Validate a pipeline dict.

    nodes/edges may be PipelineNode/PipelineEdge pydantic models or plain dicts.
    registry defaults to catalog.all().
    """
    # Normalize to dicts
    def _to_dict(x: Any) -> dict[str, Any]:
        if isinstance(x, dict):
            return x
        if hasattr(x, "model_dump"):
            return x.model_dump()
        if hasattr(x, "dict"):
            return x.dict()
        return dict(x)

    node_dicts = [_to_dict(n) for n in (nodes or [])]
    edge_dicts = [_to_dict(e) for e in (edges or [])]

    errors: list[str] = []

    # Registry — single source (Catalog deep)
    if registry is None:
        try:
            from mlblock.catalog import catalog

            registry = catalog.all()
        except Exception:
            registry = {}

    # ── basic shape ──────────────────────────────────────────────
    for n in node_dicts:
        if "id" not in n:
            errors.append("Node missing 'id'")
        if "type" not in n:
            errors.append(f"Node '{n.get('id','?')}' missing 'type'")
        elif n["type"] not in (registry or {}):
            errors.append(f"Unknown block type '{n['type']}' (node '{n.get('id','?')}')")

    node_map = {n["id"]: n for n in node_dicts if "id" in n}

    # ── port existence ────────────────────────────────────────────
    for e in edge_dicts:
        for key in ("source", "source_port", "target", "target_port"):
            if key not in e:
                errors.append(f"Edge missing '{key}'")
        if not all(k in e for k in ("source", "source_port", "target", "target_port")):
            continue
        for side, port_key in [("source", "source_port"), ("target", "target_port")]:
            nid = e[side]
            node = node_map.get(nid)
            if node is None:
                errors.append(
                    f"Node '{nid}' not found "  # noqa: E501
                    f"(edge: {e['source']}.{e['source_port']} -> {e['target']}.{e['target_port']})"
                )
                continue
            if registry is not None:
                spec = registry.get(node["type"])  # type: ignore
                if spec is not None:
                    direction = "outputs" if side == "source" else "inputs"
                    ports = getattr(spec, direction, None)
                    if ports is None:
                        ports = spec.get(direction, []) if isinstance(spec, dict) else []
                    if ports:
                        port_name = e[port_key]
                        valid = [p["name"] if isinstance(p, dict) else getattr(p, "name", None) for p in ports]
                        if port_name not in valid:
                            errors.append(
                                f"Port '{port_name}' not found on {side} '{nid}' ({node['type']}). Valid ports: {valid}"
                            )

    # ── dtype compatibility (family-aware, single table) ─────────
    if registry:
        try:
            conv_graph = build_conversion_graph(registry)
        except Exception:
            conv_graph = {}
        for e in edge_dicts:
            if not all(k in e for k in ("source", "source_port", "target", "target_port")):
                continue
            s_node = node_map.get(e["source"])
            t_node = node_map.get(e["target"])
            if not s_node or not t_node:
                continue
            s_spec = registry.get(s_node["type"])  # type: ignore
            t_spec = registry.get(t_node["type"])  # type: ignore
            if not s_spec or not t_spec:
                continue
            s_ports = getattr(s_spec, "outputs", None) or (  # noqa: E501
                s_spec.get("outputs", []) if isinstance(s_spec, dict) else []
            )
            t_ports = getattr(t_spec, "inputs", None) or (  # noqa: E501
                t_spec.get("inputs", []) if isinstance(t_spec, dict) else []
            )
            if not s_ports or not t_ports:
                continue
            s_dtype = next(  # noqa: E501
                (p["dtype"] if isinstance(p, dict) else getattr(p, "dtype", "") for p in s_ports if (p["name"] if isinstance(p, dict) else getattr(p, "name", "")) == e["source_port"]),  # noqa: E501
                None,
            )
            t_dtype = next(  # noqa: E501
                (p["dtype"] if isinstance(p, dict) else getattr(p, "dtype", "") for p in t_ports if (p["name"] if isinstance(p, dict) else getattr(p, "name", "")) == e["target_port"]),  # noqa: E501
                None,
            )
            if not s_dtype or not t_dtype:
                continue
            verdict = classify(s_dtype, t_dtype, conv_graph)
            if verdict == "incompatible":
                errors.append(
                    f"Type mismatch: {e['source']}.{e['source_port']} ({s_dtype}) -> "  # noqa: E501
                    f"{e['target']}.{e['target_port']} ({t_dtype})"  # noqa: E501
                )

    # ── cycle (topo) ──────────────────────────────────────────────
    order, has_cycle = _topological_sort(node_dicts, edge_dicts)
    if has_cycle:
        # Use the canonical wording existing tests assert on
        errors.append("Graph contains a cycle")
        order = []

    # Also surface edge source/target not found via topo gaps (already covered)
    return ValidationResult(valid=len(errors) == 0, errors=errors, order=order)
