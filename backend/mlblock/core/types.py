from __future__ import annotations

from typing import Any

VERDICT_COMPATIBLE = "compatible"
VERDICT_CONVERTIBLE = "convertible"
VERDICT_INCOMPATIBLE = "incompatible"

_WILDCARD_TYPES = {"object", "Any"}


def family_of(dtype: str) -> str:
    """Map a stringified dtype annotation to a type family.

    Unknown dtypes fall back to themselves (identity-only matching).
    """
    d = dtype.strip()
    if d == "pd.DataFrame":
        return "df"
    if d == "Model":
        return "model"
    if d == "PIL.Image.Image":
        return "image"
    if d == "dict":
        return "dict"
    if d == "numpy.ndarray":
        return "ndarray"
    if d in ("int", "float", "bool"):
        return "scalar"
    if d == "str":
        return "str"
    if d.startswith("list["):
        return "list"
    if d == "Env":
        return "env"
    if d == "Policy":
        return "policy"
    if d.startswith("torch.Tensor"):
        return "tensor"
    if d.startswith("torch.utils.data."):
        return "dataset"
    if d.startswith("torch.optim."):
        return "optim"
    if d.startswith("torch.nn."):
        return "module"
    if d.startswith("tuple["):
        return "tuple"
    if d in _WILDCARD_TYPES:
        return "any"
    return d


def build_conversion_graph(registry: dict[str, Any]) -> dict[str, set[str]]:
    """Derive the family conversion graph from the block catalog.

    Only blocks in the `transforms` category contribute edges — that
    category is the repository convention for converter blocks
    (to_tensor, df_to_tensor). Training/metric/sklearn-fit blocks are
    NOT converters despite heterogeneous port families. The catalog is
    the only source of truth — no hardcoded tables.
    """
    graph: dict[str, set[str]] = {}
    for block in registry.values():
        cat = getattr(block.category, "name", None) or str(block.category)
        if cat != "transformations":
            continue
        out_families = {f for p in block.outputs for f in map(family_of, _split_union(p["dtype"]))}
        in_families = {f for p in block.inputs for f in map(family_of, _split_union(p["dtype"]))}
        # Edge direction: the converter transforms input family → output family
        for src in in_families:
            for dst in out_families:
                if src != dst and dst != "any":
                    graph.setdefault(src, set()).add(dst)
    return graph


def _split_union(dtype: str) -> list[str]:
    """Members of a `A | B` union dtype (falls back to the raw dtype)."""
    parts = [p.strip() for p in dtype.split(" | ")]
    return parts if len(parts) > 1 else [dtype]


def classify(src_dtype: str, tgt_dtype: str, graph: dict[str, set[str]]) -> str:
    """4-way verdict for a connection A.out → B.in (union-aware).

    - compatible: identical dtype, wildcard target (object/Any), same family
      on any union member
    - convertible: a conversion path exists in the graph
    - incompatible: otherwise
    """
    srcs = _split_union(src_dtype)
    tgts = _split_union(tgt_dtype)
    for t in tgts:
        if t in _WILDCARD_TYPES:
            return VERDICT_COMPATIBLE
    for s in srcs:
        for t in tgts:
            if s == t or family_of(s) == family_of(t):
                return VERDICT_COMPATIBLE
    for s in srcs:
        for t in tgts:
            if _reachable(family_of(s), family_of(t), graph):
                return VERDICT_CONVERTIBLE
    return VERDICT_INCOMPATIBLE


def _reachable(src: str, dst: str, graph: dict[str, set[str]]) -> bool:
    if src == dst:
        return True
    seen, stack = {src}, [src]
    while stack:
        cur = stack.pop()
        for nxt in graph.get(cur, ()):
            if nxt == dst:
                return True
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return False
