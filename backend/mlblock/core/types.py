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
    if d == "dict":
        return "dict"
    if d == "numpy.ndarray":
        return "ndarray"
    if d in ("int", "float", "bool"):
        return "scalar"
    if d == "str":
        return "str"
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
        if cat != "transforms":
            continue
        out_families = {family_of(p["dtype"]) for p in block.outputs}
        in_families = {family_of(p["dtype"]) for p in block.inputs}
        # Edge direction: the converter transforms input family → output family
        for src in in_families:
            for dst in out_families:
                if src != dst and dst != "any":
                    graph.setdefault(src, set()).add(dst)
    return graph


def classify(src_dtype: str, tgt_dtype: str, graph: dict[str, set[str]]) -> str:
    """4-way verdict for a connection A.out → B.in.

    - compatible: identical dtype, wildcard target (object/Any), or same family
    - convertible: a conversion path exists in the graph
    - incompatible: otherwise
    """
    if tgt_dtype in _WILDCARD_TYPES or src_dtype == tgt_dtype:
        return VERDICT_COMPATIBLE
    if family_of(src_dtype) == family_of(tgt_dtype):
        return VERDICT_COMPATIBLE
    if _reachable(family_of(src_dtype), family_of(tgt_dtype), graph):
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
