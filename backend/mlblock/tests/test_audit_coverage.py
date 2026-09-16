from __future__ import annotations

import sys
from pathlib import Path

# Ajouter backend/scripts au sys.path
SCRIPTS_DIR = Path(__file__).resolve().parent.parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from audit_coverage import audit_exercises, build_coverage_markdown, get_block_status  # noqa: E402


def test_audit_exercises_baseline():
    exo_results, block_to_exos, all_blocks = audit_exercises()

    assert len(exo_results) == 12
    assert len(all_blocks) == 91

    passing = {e["id"] for e in exo_results if e["valid"]}
    failing = {e["id"] for e in exo_results if not e["valid"]}

    assert passing == {"A1", "A2", "A3", "A4", "A5", "A6", "A7", "B1", "B2", "B3", "C1", "C2"}
    assert failing == set()

    # All 12 generate code without exception
    assert all(e["codegen_ok"] for e in exo_results)

    # 41 blocks used directly in the 12 reference exercises
    assert len(block_to_exos) == 41


def test_get_block_status():
    assert get_block_status("conv2d") == "delete"
    assert get_block_status("relu") == "merge"
    assert get_block_status("embedding") == "deprecate"
    assert get_block_status("elu") == "hide"
    assert get_block_status("conv2d_layer") == "keep"
    assert get_block_status("adam") == "keep"


def test_build_coverage_markdown():
    exo_results, block_to_exos, all_blocks = audit_exercises()
    md = build_coverage_markdown(exo_results, block_to_exos, all_blocks)

    # Verify key sections
    assert "# Matrice de Couverture & Audit des Gaps (coverage.md)" in md
    assert "## 1. Synthèse de Validation Baseline (12 Exercices)" in md
    assert "## 2. Matrice Complète des" in md
    assert "## 3. Analyse Détaillée des Gaps P0 (Bloquants v1)" in md
    assert "## 4. Analyse des Gaps P1 (Secondaires / Post-v1)" in md

    # Verify passing and failing lists (12/12 green after gap fixes)
    assert "A1, A2, A3, A4, A5, A6, A7, B1, B2, B3, C1, C2" in md

    # Verify P0 gap names
    assert "Gap P0.1" in md
    assert "Gap P0.2" in md
    assert "Gap P0.3" in md
    assert "Gap P0.4" in md
    assert "Gap P0.5" in md

    # Verify P1 gap names
    assert "Gap P1.1" in md
    assert "Gap P1.2" in md
