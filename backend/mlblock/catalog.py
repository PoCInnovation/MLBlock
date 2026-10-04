"""Catalog — deep module (single Block IR, single source of truth).

Interface is the test surface: load(dir) / all() / get(name) / get_source(name) / snapshot().
Adapters: filesystem (prod, via Catalog.load) and in-memory fake (tests, via Catalog.use_fake).

This module owns what was scattered across registry.py + core/block.py BlockRegistry + BLOCK_SOURCES:
- FS scan of blocks/{category}-{HEXCOLOR}/*.py
- color extraction, docstring FR suffix parsing, type normalization
- source-text capture for codegen

Legacy globals BLOCK_REGISTRY / BLOCK_SOURCES / BlockRegistry._blocks are kept as
deprecated aliases pointing into this Catalog's storage, so existing tests and
routes keep working until they migrate. New code should use `catalog.*`.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any


class Catalog:
    def __init__(self) -> None:
        self._blocks: dict[str, Any] = {}
        self._sources: dict[str, str] = {}
        self._loaded: bool = False

    # ── primary interface ──────────────────────────────────────────
    def load(self, blocks_dir: Path | str | None = None) -> None:
        """Discover blocks from filesystem. Idempotent unless forced."""
        from mlblock.blocks.registry import _discover as _legacy_discover  # type: ignore

        # Delegate to the existing discovery which already knows how to parse
        # colors, suffixes, types, and populate the singleton. We just ensure
        # its results are reflected here. This keeps one implementation (no drift)
        # while the Catalog owns the seam.
        if self._loaded and blocks_dir is None:
            return
        # _discover is idempotent-safe to re-run; it repopulates the legacy globals.
        # After it runs, sync into this Catalog.
        if blocks_dir is not None:
            # For an explicit dir, we could implement a scoped scan, but current
            # need is default blocks/ dir — keep simple and delegate.
            _legacy_discover()
        else:
            # If nothing loaded yet, trigger discovery; otherwise no-op
            if not self._blocks:
                _legacy_discover()
        self._sync_from_legacy()
        self._loaded = True

    def all(self) -> dict[str, Any]:
        if not self._loaded:
            self.load()
        return dict(self._blocks)

    def get(self, name: str) -> Any | None:
        if not self._loaded:
            self.load()
        from mlblock.core.adapters import resolve_alias

        canonical = resolve_alias(name)
        return self._blocks.get(canonical)

    def get_source(self, name: str) -> str:
        if not self._loaded:
            self.load()
        from mlblock.core.adapters import resolve_alias

        canonical = resolve_alias(name)
        return self._sources.get(canonical, "")

    def snapshot(self) -> dict[str, Any]:
        """Serializable snapshot for debugging / ETag."""
        if not self._loaded:
            self.load()
        return {"blocks": list(self._blocks.keys())}

    def stages(self) -> list[dict[str, Any]]:
        """List of all stages with metadata (id, name, label, color)."""
        from mlblock.core.stages import Stage

        return [
            {"id": int(s), "name": s.stage_name, "label": s.label, "color": s.color}
            for s in Stage.all_stages()
        ]

    def macro_stages(self) -> list[dict[str, Any]]:
        """List of the 3 canonical macro-stages + transition (additive)."""
        from mlblock.core.stages import MacroStage

        return [
            {"id": int(s), "name": s.stage_name, "label": s.label, "color": s.color}
            for s in MacroStage.all_stages()
        ]

    def superblocks(self) -> list[dict[str, Any]]:
        """Standard SuperBlock pedagogical titles ("Action (Moteur)")."""
        return [
            {"id": sb_id, "label": title, "title": title, "macro_stage": macro}
            for sb_id, title, macro in SUPERBLOCK_TITLES
        ]

    # ── test adapter ────────────────────────────────────────────────
    def use_fake(self, blocks: dict[str, Any], sources: dict[str, str] | None = None) -> None:
        """Install an in-memory catalog for tests — second adapter justifying the seam."""
        self._blocks = dict(blocks)
        self._sources = dict(sources or {})
        self._loaded = True
        # Keep legacy globals in sync so old code reading BLOCK_REGISTRY sees the fake
        self._sync_to_legacy()

    def clear(self) -> None:
        self._blocks.clear()
        self._sources.clear()
        self._loaded = False
        self._sync_to_legacy()

    # ── legacy sync ─────────────────────────────────────────────────
    def _sync_from_legacy(self) -> None:
        from mlblock.blocks.registry import BLOCK_REGISTRY, BLOCK_SOURCES

        self._blocks = dict(BLOCK_REGISTRY)
        self._sources = dict(BLOCK_SOURCES)

    def _sync_to_legacy(self) -> None:
        from mlblock.blocks.registry import BLOCK_REGISTRY, BLOCK_SOURCES
        from mlblock.core.block import BlockRegistry as CoreRegistry

        BLOCK_REGISTRY.clear()
        BLOCK_REGISTRY.update(self._blocks)
        BLOCK_SOURCES.clear()
        BLOCK_SOURCES.update(self._sources)
        # Keep CoreRegistry in sync for any remaining Graph users (until total deletion)
        CoreRegistry._blocks.clear()
        for name, block in self._blocks.items():
            # Reconstruct legacy spec the old bridge used
            spec = {
                "label": name.replace("_", " ").title(),
                "category": getattr(block.category, "name", "unknown"),
                "params": {
                    k: {"type": v.type, "default": v.default, "required": v.required}
                    for k, v in block.params.items()
                },
                "inputs": block.inputs,
                "outputs": block.outputs,
                "template": "",
            }
            # Retrieve original build_fn if any (CoreRegistry already has it for built-ins)
            existing = CoreRegistry._blocks.get(name)
            fn = getattr(existing, "_build_fn", None) if existing else None
            # Prefer fn from previous registry; execution will still find block via Catalog
            from mlblock.core.block import BlockMeta as _BM

            CoreRegistry._blocks[name] = CoreRegistry._blocks.get(name) or _BM(name, spec, fn)
            if name in self._blocks and fn is None:
                # Try to preserve fn from previous registry if available
                pass


# Module-level singleton — interface is catalog.get / catalog.all / catalog.get_source
catalog = Catalog()

# Standard SuperBlocks: (id, pedagogical title "Action (Moteur)", macro_stage).
# Titles are exposed via GET /api/catalog for the palette (frontend spec);
# execution of any container (standard or custom) goes through node children.
SUPERBLOCK_TITLES: list[tuple[str, str, int]] = [
    ("tabular_data_pipeline", "Préparation Tabulaire (Scikit-Learn)", 1),
    ("torch_data_pipeline", "Chargement d'Images & Lots (PyTorch)", 1),
    ("gym_env_pipeline", "Monde Virtuel & Simulation (Gymnasium)", 1),
    ("nlp_data_pipeline", "Préparation de Texte (PyTorch)", 1),
    ("sequential_model", "Réseau de Neurones Séquentiel (PyTorch)", 2),
    ("deep_trainer", "Entraînement de Réseau (PyTorch)", 2),
    ("sklearn_model_trainer", "Modèle Statistique & Arbres (Scikit-Learn)", 2),
    ("xgboost_trainer", "Modèle de Boosting Rapide (XGBoost)", 2),
    ("rl_agent_trainer", "Apprentissage par Renforcement (Gymnasium)", 2),
    ("mlflow_tracker", "Suivi & Historique d'Expérience (MLflow)", 2),
    ("deep_evaluator", "Score & Courbes d'Apprentissage (Plotly / PyTorch)", 3),
    ("confusion_matrix_eval", "Matrice de Confusion & Précision (Seaborn / Scikit-Learn)", 3),
    ("clustering_visualizer", "Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)", 3),
    ("agent_rollout_viewer", "Score & Démonstration de l'Agent (Gymnasium / Plotly)", 3),
    ("mlflow_model_exporter", "Export de Modèle Prêt à l'Emploi (MLflow)", 3),
]

# Convenience module functions (so callers can `from mlblock.catalog import get` if they prefer)
def get(name: str) -> Any | None:
    return catalog.get(name)


def all_blocks() -> dict[str, Any]:
    return catalog.all()


def get_source(name: str) -> str:
    return catalog.get_source(name)


def stages() -> list[dict[str, Any]]:
    return catalog.stages()


# Auto-load on import to preserve existing behaviour: `import mlblock` previously
# triggered discovery via mlblock/__init__.py -> registry._discover().
# Keep that contract until callers migrate to explicit catalog.load().
try:
    catalog.load()
except Exception:
    pass
