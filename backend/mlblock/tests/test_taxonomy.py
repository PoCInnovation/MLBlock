from __future__ import annotations

from pathlib import Path

from mlblock.blocks.registry import BLOCK_REGISTRY

BLOCKS_DIR = Path(__file__).resolve().parent.parent / "blocks"


def _block_files() -> list[Path]:
    return sorted(
        p for p in BLOCKS_DIR.rglob("*.py")
        if "__pycache__" not in p.parts and not p.name.startswith("_") and p.name != "registry.py"
    )


def test_every_block_file_is_registered():
    names = {p.stem for p in _block_files()}
    assert names <= set(BLOCK_REGISTRY), names - set(BLOCK_REGISTRY)


def test_no_block_file_at_macro_root():
    loose = [p for p in BLOCKS_DIR.glob("*.py") if not p.name.startswith("_") and p.name != "registry.py"]
    assert loose == []


def test_category_names_unique():
    """Real block categories: one macro per category name. Superblocks are checked by payload id below."""
    by_name: dict[str, set[int]] = {}
    for b in BLOCK_REGISTRY.values():
        if b.category.name == "superblocks":
            continue
        by_name.setdefault(b.category.name, set()).add(b.category.macro)
    assert all(len(macros) == 1 for macros in by_name.values()), by_name


def test_catalog_superblock_categories_have_distinct_ids():
    from mlblock.server.routes import get_catalog

    payload = get_catalog(request=None, all=True)
    ids = [c["id"] for c in payload["categories"] if c["id"].startswith("superblocks")]
    assert len(ids) == 3 and len(set(ids)) == 3, ids
    assert {c["macro"] for c in payload["categories"] if c["id"].startswith("superblocks")} == {1, 2, 3}


def test_macro_and_transition_from_folder():
    linear_layer = BLOCK_REGISTRY["linear_layer"]
    assert linear_layer.category.name == "couches"
    assert linear_layer.macro_stage == 2
    assert linear_layer.is_transition is False
    to_tensor = BLOCK_REGISTRY["to_tensor"]
    assert to_tensor.category.name == "conversions"
    assert to_tensor.is_transition is True


def test_macro_of_folder():
    from mlblock.core.stages import MacroStage, macro_of_folder

    assert macro_of_folder("1-donnees") is MacroStage.DATA
    assert macro_of_folder("2-modele") is MacroStage.MODEL_TRAIN
    assert macro_of_folder("3-resultats") is MacroStage.RESULTS
    assert macro_of_folder("conversions") is MacroStage.TRANSITION


def test_category_shade_distinct_and_valid():
    import re

    from mlblock.core.stages import category_shade

    shades = [category_shade("#6366F1", i, 5) for i in range(5)]
    assert len(set(shades)) == 5
    assert category_shade("#6366F1", 0, 5) == "#6366F1"
    assert all(re.fullmatch(r"#[0-9A-F]{6}", s) for s in shades)
