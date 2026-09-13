from __future__ import annotations

from typing import Any

from mlblock.core.stages import Stage
from mlblock.core.types import (
    VERDICT_COMPATIBLE,
    VERDICT_CONVERTIBLE,
    VERDICT_INCOMPATIBLE,
    _split_union,
    build_conversion_graph,
    classify,
    family_of,
)


class TypeSystem:
    """Facade for type classification, stage resolution, and connection diagnostics.

    Central interface used by validation, generator, catalog, and routes.
    """

    def __init__(self) -> None:
        self._conversion_graph: dict[str, set[str]] | None = None

    def family_of(self, dtype: str) -> str:
        """Map a stringified dtype annotation to a type family."""
        return family_of(dtype)

    def build_conversion_graph(self, registry: dict[str, Any] | None = None) -> dict[str, set[str]]:
        """Derive the family conversion graph from the block catalog."""
        if registry is None:
            try:
                from mlblock.catalog import catalog

                registry = catalog.all()
            except Exception:
                registry = {}
        graph = build_conversion_graph(registry)
        self._conversion_graph = graph
        return graph

    def classify(
        self,
        src_dtype: str,
        tgt_dtype: str,
        graph: dict[str, set[str]] | None = None,
    ) -> str:
        """Verdict for connection A.out -> B.in ('compatible' | 'convertible' | 'incompatible')."""
        if graph is None:
            if self._conversion_graph is None:
                self.build_conversion_graph()
            graph = self._conversion_graph or {}
        return classify(src_dtype, tgt_dtype, graph)

    def stage_of(self, block_or_family: str, category: str | None = None) -> Stage:
        """Map a block name, category, or type family to its Stage."""
        from mlblock.core.adapters import resolve_alias
        from mlblock.core.stages import (
            STAGE_OF_BLOCK_OVERRIDES,
            STAGE_OF_CATEGORY,
            STAGE_OF_FAMILY,
            stage_of_block,
            stage_of_category,
            stage_of_family,
        )

        canonical = resolve_alias(block_or_family)
        if canonical in STAGE_OF_BLOCK_OVERRIDES:
            return STAGE_OF_BLOCK_OVERRIDES[canonical]

        cat_key = block_or_family.split("-")[0].strip().lower()
        if cat_key in STAGE_OF_CATEGORY:
            return stage_of_category(block_or_family)

        fam_key = block_or_family.strip().lower()
        if fam_key in STAGE_OF_FAMILY:
            return stage_of_family(fam_key)

        return stage_of_block(block_or_family, category)

    def find_converter(
        self,
        src_dtype: str,
        tgt_dtype: str,
        registry: dict[str, Any] | None = None,
    ) -> str | None:
        """Find a converter block from transformations that accepts src_dtype and outputs tgt_dtype."""
        src_fam = self.family_of(src_dtype)
        tgt_fam = self.family_of(tgt_dtype)

        # Standard conversion mappings (available even without catalog loaded)
        quick_map = {
            ("df", "tensor"): "df_to_tensor",
            ("ndarray", "tensor"): "to_tensor",
            ("image", "tensor"): "to_tensor",
        }
        if (src_fam, tgt_fam) in quick_map:
            return quick_map[(src_fam, tgt_fam)]

        if registry is None:
            try:
                from mlblock.catalog import catalog

                registry = catalog.all()
            except Exception:
                registry = {}

        for name, block in registry.items():
            cat = getattr(block.category, "name", None) or str(block.category)
            if cat != "transformations":
                continue
            inputs = getattr(block, "inputs", []) or []
            outputs = getattr(block, "outputs", []) or []
            in_families = {
                self.family_of(f)
                for p in inputs
                for f in _split_union(p["dtype"] if isinstance(p, dict) else getattr(p, "dtype", ""))
            }
            out_families = {
                self.family_of(f)
                for p in outputs
                for f in _split_union(p["dtype"] if isinstance(p, dict) else getattr(p, "dtype", ""))
            }
            if src_fam in in_families and tgt_fam in out_families:
                return name
        return None

    def can_connect(
        self,
        src_dtype: str,
        tgt_dtype: str,
        graph: dict[str, set[str]] | None = None,
        src_block: str | None = None,
        tgt_block: str | None = None,
    ) -> tuple[str, str | None]:
        """Classify connection and return (verdict, human-friendly diagnostic/suggestion)."""
        verdict = self.classify(src_dtype, tgt_dtype, graph)
        if verdict == VERDICT_COMPATIBLE:
            return (VERDICT_COMPATIBLE, None)

        conv = self.find_converter(src_dtype, tgt_dtype)
        if verdict == VERDICT_CONVERTIBLE:
            if conv:
                if src_block and tgt_block:
                    msg = f"Astuce : insérez un Block {conv} entre '{src_block}' et '{tgt_block}'"
                else:
                    msg = f"Astuce : insérez un Block {conv}"
            else:
                msg = f"Type convertible de {src_dtype} vers {tgt_dtype}"
            return (VERDICT_CONVERTIBLE, msg)

        # Incompatible verdict
        if conv:
            msg = f"Type mismatch: {src_dtype} -> {tgt_dtype}. Astuce : insérez un Block {conv}"
        else:
            msg = f"Type mismatch: {src_dtype} -> {tgt_dtype}. Aucune conversion possible"
        return (VERDICT_INCOMPATIBLE, msg)


# Module singleton
type_system = TypeSystem()
