"""Exhaustive block-to-block connection matrix over the REAL catalog.

Complements test_type_system.py (unit tests on a handful of hand-picked
dtypes): here we sweep every port of every real block to check properties
that must hold catalog-wide, then cross-check a representative sample of
each verdict bucket against validate() — not just classify() in isolation.
"""
from __future__ import annotations

from collections.abc import Iterator

import pytest

from mlblock.catalog import catalog
from mlblock.core.type_system import type_system
from mlblock.core.types import VERDICT_COMPATIBLE, VERDICT_CONVERTIBLE, VERDICT_INCOMPATIBLE
from mlblock.validation import validate


def _ports(registry: dict, direction: str) -> Iterator[tuple[str, str, str]]:
    """Yield (block_name, port_name, dtype) for every port in `direction`."""
    for block_name, block in registry.items():
        for port in getattr(block, direction, None) or []:
            yield block_name, port["name"], port["dtype"]


@pytest.fixture(scope="module")
def registry() -> dict:
    return catalog.all()


@pytest.fixture(scope="module")
def graph(registry: dict) -> dict:
    return type_system.build_conversion_graph(registry)


def test_catalog_is_loaded_and_has_converters(registry: dict) -> None:
    # Guards against an empty/broken catalog making every property below
    # vacuously true.
    assert len(registry) >= 50
    categories = {getattr(b.category, "name", str(b.category)) for b in registry.values()}
    assert "transformations" in categories


def test_wildcard_target_port_is_always_compatible(registry: dict, graph: dict) -> None:
    outputs = list(_ports(registry, "outputs"))
    wildcard_inputs = [p for p in _ports(registry, "inputs") if p[2] in ("object", "Any")]
    assert wildcard_inputs, "aucun port wildcard trouvé dans le catalogue réel (plot_predictions.in_1 attendu)"
    for _, _, tgt_dtype in wildcard_inputs:
        for _, _, src_dtype in outputs:
            assert type_system.classify(src_dtype, tgt_dtype, graph) == VERDICT_COMPATIBLE


def test_every_dtype_is_compatible_with_itself(registry: dict, graph: dict) -> None:
    dtypes = {d for _, _, d in _ports(registry, "outputs")} | {d for _, _, d in _ports(registry, "inputs")}
    for dtype in dtypes:
        assert type_system.classify(dtype, dtype, graph) == VERDICT_COMPATIBLE, dtype


def test_any_family_only_comes_from_declared_wildcards(registry: dict) -> None:
    # "any" must stay the wildcard's family exclusively — never an accidental
    # family (ADR 0001 acceptance criterion: no dtype: Any leaking elsewhere).
    for block_name, port_name, dtype in [*_ports(registry, "inputs"), *_ports(registry, "outputs")]:
        if dtype in ("object", "Any"):
            continue
        assert type_system.family_of(dtype) != "any", (
            f"{block_name}.{port_name} ({dtype}) retombe dans la famille 'any' sans être un wildcard déclaré"
        )


@pytest.mark.parametrize(
    "src_block,src_port,tgt_block,tgt_port,expected",
    [
        # compatible: module -> module, même famille (composition de couches réelles)
        ("conv2d_layer", "out_1", "relu_layer", "in_1", VERDICT_COMPATIBLE),
        # convertible: df -> tensor via df_to_tensor (pas de bloc direct df->tensor ici)
        ("load_csv", "out_1", "sigmoid", "in_1", VERDICT_CONVERTIBLE),
        # incompatible: Policy -> df, aucune famille/conversion commune
        ("q_learning", "out_1", "standard_scaler", "in_1", VERDICT_INCOMPATIBLE),
    ],
)
def test_classify_verdict_matches_validate_outcome(
    registry: dict,
    graph: dict,
    src_block: str,
    src_port: str,
    tgt_block: str,
    tgt_port: str,
    expected: str,
) -> None:
    s_dtype = next(p["dtype"] for p in registry[src_block].outputs if p["name"] == src_port)
    t_dtype = next(p["dtype"] for p in registry[tgt_block].inputs if p["name"] == tgt_port)
    assert type_system.classify(s_dtype, t_dtype, graph) == expected

    r = validate(
        [{"id": "s", "type": src_block, "params": {}}, {"id": "t", "type": tgt_block, "params": {}}],
        [{"source": "s", "source_port": src_port, "target": "t", "target_port": tgt_port}],
        registry=registry,
    )
    has_type_mismatch = any("Type mismatch" in e for e in r.errors)
    assert has_type_mismatch == (expected == VERDICT_INCOMPATIBLE)
