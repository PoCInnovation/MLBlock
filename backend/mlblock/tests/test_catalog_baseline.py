"""Catalog baseline guard (block taxonomy rework).

Every block key present at baseline must keep resolving (directly or via
a legacy alias). This is the test that would have caught phantom entries:
it asserts resolvability, not dictionary contents.
"""
from __future__ import annotations

import json
from pathlib import Path


def _baseline() -> dict:
    path = Path(__file__).resolve().parent / "fixtures" / "catalog_baseline.json"
    return json.loads(path.read_text(encoding="utf-8"))


def test_no_baseline_block_is_lost():
    from mlblock.catalog import catalog

    snap = _baseline()
    assert len(snap) == 111
    missing = [name for name in snap if catalog.get(name) is None]
    assert missing == [], f"baseline blocks no longer resolve: {missing}"


def test_catalog_only_grows_by_documented_additions():
    from mlblock.catalog import catalog

    snap = _baseline()
    current = set(catalog.all().keys())
    # Removals must go through LEGACY_BLOCK_ALIASES (still resolvable above);
    # hard removals from the registry itself are forbidden without a test update.
    assert set(snap) <= current, f"blocks dropped from registry: {sorted(set(snap) - current)}"
