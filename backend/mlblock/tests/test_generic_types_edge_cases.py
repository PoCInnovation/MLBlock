""""Farfelu" connections: the angles the family-based type system cannot see.

`family_of` reduces every dtype to a coarse family (df, tensor, list, dict,
tuple, any, …) with NO notion of a type *parameter* — unlike a real generic
system, `list[str]` and `list[int]` collapse to the exact same family `list`.
These tests pin down that known limitation (documented in
docs/adr/0001-staged-typing.md's risk section) plus a few other edge cases
that are easy to break by accident: wildcard direction, multi-hop conversion,
and the fact that a *type*-compatible connection can still be *stage*-blocked.

Pattern: ad hoc fake specs via SimpleNamespace, same spirit as
test_validation.py's CoreRegistry.register fixtures — no real catalog block
is touched.
"""
from __future__ import annotations

from types import SimpleNamespace

from mlblock.catalog import catalog
from mlblock.core.type_system import type_system
from mlblock.core.types import VERDICT_COMPATIBLE, VERDICT_CONVERTIBLE, VERDICT_INCOMPATIBLE
from mlblock.validation import validate


def _fake_block(category: str, inputs: list[dict], outputs: list[dict]):
    return SimpleNamespace(category=SimpleNamespace(name=category), inputs=inputs, outputs=outputs)


# ── les génériques ne sont pas vraiment génériques ──────────────────────


def test_list_of_str_and_list_of_int_collapse_to_the_same_family() -> None:
    # Connu : family_of ne regarde pas le paramètre de type, seulement le
    # préfixe "list[" — list[str] et list[int] sont donc jugés COMPATIBLES
    # bien que les éléments diffèrent. Un vrai bloc qui consommerait list[int]
    # n'existe pas dans le catalogue (seul list[str] y figure), mais un bloc
    # futur mal typé passerait ce check sans broncher.
    assert type_system.family_of("list[str]") == type_system.family_of("list[int]") == "list"
    assert type_system.classify("list[str]", "list[int]", {}) == VERDICT_COMPATIBLE


def test_tuple_of_different_inner_types_collapses_to_the_same_family() -> None:
    assert type_system.family_of("tuple[int, int]") == type_system.family_of("tuple[str]") == "tuple"
    assert type_system.classify("tuple[int, int]", "tuple[str]", {}) == VERDICT_COMPATIBLE


# ── unions : "A | B" ne matche que si un membre est commun ──────────────


def test_union_with_one_shared_member_is_compatible() -> None:
    assert type_system.classify("pd.DataFrame | Env", "torch.Tensor | pd.DataFrame", {}) == VERDICT_COMPATIBLE


def test_union_with_no_shared_member_and_no_path_is_incompatible() -> None:
    assert type_system.classify("Env | Policy", "pd.DataFrame | int", {}) == VERDICT_INCOMPATIBLE


# ── wildcard : seule la CIBLE est magique, pas la source ────────────────


def test_wildcard_target_accepts_anything() -> None:
    assert type_system.classify("Env", "object", {}) == VERDICT_COMPATIBLE
    assert type_system.classify("object", "Any", {}) == VERDICT_COMPATIBLE


def test_wildcard_as_source_is_not_automatically_compatible() -> None:
    # "Any" en SOURCE n'est pas un joker : c'est un dtype normal qui doit
    # matcher la cible comme n'importe quel autre. Facile à casser par
    # erreur en ajoutant un check symétrique dans classify().
    assert type_system.classify("Any", "pd.DataFrame", {}) == VERDICT_INCOMPATIBLE
    assert type_system.classify("object", "torch.Tensor", {}) == VERDICT_INCOMPATIBLE


# ── conversion multi-hop (DFS transitif, pas juste un saut direct) ───────


def test_conversion_graph_is_transitive_across_two_hops() -> None:
    fake_registry = {
        "x_to_y": _fake_block(
            "transformations",
            [{"name": "in_1", "dtype": "FakeX"}],
            [{"name": "out_1", "dtype": "FakeY"}],
        ),
        "y_to_z": _fake_block(
            "transformations",
            [{"name": "in_1", "dtype": "FakeY"}],
            [{"name": "out_1", "dtype": "FakeZ"}],
        ),
    }
    graph = type_system.build_conversion_graph(fake_registry)
    # pas d'arête directe FakeX -> FakeZ dans le graphe, seulement via FakeY
    assert "FakeZ" not in graph.get("FakeX", set())
    assert type_system.classify("FakeX", "FakeZ", graph) == VERDICT_CONVERTIBLE
    # sans le bloc intermédiaire y_to_z, la conversion n'existe plus
    partial_graph = type_system.build_conversion_graph({"x_to_y": fake_registry["x_to_y"]})
    assert type_system.classify("FakeX", "FakeZ", partial_graph) == VERDICT_INCOMPATIBLE


# ── compatible au niveau TYPE mais bloqué au niveau STAGE ────────────────


def test_type_compatible_connection_still_blocked_by_world_isolation() -> None:
    # q_learning (catégorie "renforcement", Stage.WORLD réel) produit une
    # "Policy". Un bloc hors-catalogue qui consommerait aussi une "Policy"
    # hors du monde RL (pas dans WORLD_BRIDGES) a un dtype PARFAITEMENT
    # compatible (même type exact) mais doit quand même être rejeté : le
    # mur Stage.WORLD est un check indépendant de classify().
    fake_policy_consumer = _fake_block(
        "entrainement", [{"name": "in_1", "dtype": "Policy"}], [{"name": "out_1", "dtype": "float"}]
    )
    registry = {"q_learning": catalog.get("q_learning"), "policy_consumer": fake_policy_consumer}

    graph = type_system.build_conversion_graph(registry)
    assert type_system.classify("Policy", "Policy", graph) == VERDICT_COMPATIBLE

    r = validate(
        [{"id": "q", "type": "q_learning", "params": {}}, {"id": "pc", "type": "policy_consumer", "params": {}}],
        [{"source": "q", "source_port": "out_1", "target": "pc", "target_port": "in_1"}],
        registry=registry,
    )
    assert r.valid is False
    assert any("Stage.WORLD is isolated" in e for e in r.errors)
    assert not any("Type mismatch" in e for e in r.errors)


# ── auto-référence : cycle dégénéré à 1 nœud ─────────────────────────────


def test_self_loop_is_detected_as_a_cycle() -> None:
    r = validate(
        [{"id": "a", "type": "relu_layer", "params": {}}],
        [{"source": "a", "source_port": "out_1", "target": "a", "target_port": "in_1"}],
    )
    assert r.valid is False
    assert any("cycle" in e.lower() for e in r.errors)
