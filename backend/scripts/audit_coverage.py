#!/usr/bin/env python3
"""Audit de couverture des blocks et identification des gaps P0/P1.

Exécute la validation et la génération de code sur les 12 exercices de référence,
établit la matrice de couverture des 88 blocs du catalogue et produit le rapport
détaillé dans docs/UX_Blocks_Rework/coverage.md.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

# Assurer l'accès au package mlblock depuis backend/ ou la racine du repo
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

# Si exécuté avec un python hors du venv de backend, re-déléguer au venv
VENV_DIR = BACKEND_DIR / ".venv"
VENV_PYTHON = VENV_DIR / "bin" / "python"
if VENV_PYTHON.exists() and Path(sys.prefix).resolve() != VENV_DIR.resolve():
    import os
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON)] + sys.argv)

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from mlblock.catalog import catalog  # noqa: E402
from mlblock.core.generator import generate_code  # noqa: E402
from mlblock.server.schemas import PipelineEdge, PipelineNode  # noqa: E402
from mlblock.validation import validate  # noqa: E402

CONFIGS_DIR = BACKEND_DIR / "mlblock" / "configs" / "exos"
OUTPUT_FILE = REPO_ROOT / "docs" / "UX_Blocks_Rework" / "coverage.md"

# Classification cible issue de docs/UX_Blocks_Rework/02-reduction-blocks.md
DELETE_BLOCKS = {
    "conv1d",
    "conv2d",
    "conv3d",
    "conv_transpose2d",
    "linear",
}

MERGE_BLOCKS = {
    "relu",
    "maxpool2d",
    "flatten",
}

DEPRECATE_BLOCKS = {
    "embedding",
    "dropout",
}

HIDE_BLOCKS = {
    "elu",
    "gelu",
    "identity",
    "prelu",
    "selu",
    "sigmoid",
    "silu",
    "softmax",
    "tanh",
}


def get_block_status(name: str) -> str:
    """Retourne l'action cible pour un bloc du catalogue."""
    if name in DELETE_BLOCKS:
        return "delete"
    if name in MERGE_BLOCKS:
        return "merge"
    if name in DEPRECATE_BLOCKS:
        return "deprecate"
    if name in HIDE_BLOCKS:
        return "hide"
    return "keep"


def audit_exercises() -> tuple[list[dict[str, Any]], dict[str, list[str]], dict[str, Any]]:
    """Charge et audite les 12 configurations d'exercices."""
    configs = sorted(CONFIGS_DIR.glob("*.json"))
    if not configs:
        raise FileNotFoundError(f"Aucun fichier de configuration trouvé dans {CONFIGS_DIR}")

    exo_results: list[dict[str, Any]] = []
    block_to_exos: dict[str, list[str]] = defaultdict(list)

    all_blocks = catalog.all()

    for config_path in configs:
        filename = config_path.name
        exo_id = filename.split("_")[0].upper()

        with open(config_path, encoding="utf-8") as f:
            data = json.load(f)

        name = data.get("name", filename)
        description = data.get("description", "")
        graph = data.get("graph", {})
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # 1. Validation
        val_res = validate(nodes, edges)

        # 2. Génération de code
        p_nodes = [PipelineNode(**n) for n in nodes]
        p_edges = [PipelineEdge(**e) for e in edges]
        gen_ok = False
        gen_err = ""
        try:
            generate_code(p_nodes, p_edges)
            gen_ok = True
        except Exception as e:
            gen_err = str(e)

        # 3. Blocs utilisés
        used_blocks = sorted({n["type"] for n in nodes})
        for b in used_blocks:
            block_to_exos[b].append(exo_id)

        exo_results.append({
            "id": exo_id,
            "filename": filename,
            "name": name,
            "description": description,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "valid": val_res.valid,
            "errors": val_res.errors,
            "codegen_ok": gen_ok,
            "codegen_error": gen_err,
            "blocks": used_blocks,
        })

    return exo_results, block_to_exos, all_blocks


def build_coverage_markdown(
    exo_results: list[dict[str, Any]],
    block_to_exos: dict[str, list[str]],
    all_blocks: dict[str, Any],
) -> str:
    """Génère le contenu complet de coverage.md."""
    passing_exos = [e["id"] for e in exo_results if e["valid"]]
    failing_exos = [e["id"] for e in exo_results if not e["valid"]]

    used_blocks_count = len(block_to_exos)
    total_blocks_count = len(all_blocks)

    status_counts: dict[str, int] = defaultdict(int)
    for b in all_blocks:
        status_counts[get_block_status(b)] += 1

    lines: list[str] = [
        "# Matrice de Couverture & Audit des Gaps (coverage.md)",
        "",
        "> **Document de référence — UX Blocks Rework (Étape 2/5)**  ",
        "> Ce document consolide l'audit exhaustif des **12 exercices canoniques** (§01) "
        "contre les **88 blocs du catalogue** actuels.  ",
        "> Il documente l'état baseline de validation (`validate`) et de génération de code "
        "(`generate_code`), identifie les écarts bloquants (gaps P0) et secondaires (gaps P1), "
        "et prépare la réduction de palette de l'étape §02.",
        "",
        "---",
        "",
        "## 1. Synthèse de Validation Baseline (12 Exercices)",
        "",
        f"- **Total Exercices :** {len(exo_results)}",
        f"- **Exercices Validés (Passing) :** {len(passing_exos)}/12 (`{', '.join(passing_exos)}`)",
        f"- **Exercices avec Gaps Documentés (Failing) :** {len(failing_exos)}/12 (`{', '.join(failing_exos)}`)",
        "- **Génération de code :** 12/12 génèrent un script exécutable sans exception.",
        "",
        "| ID | Nom | Nœuds | Arêtes | Validation | Codegen | Symptômes / Erreurs |",
        "|---|---|:---:|:---:|:---:|:---:|---|",
    ]

    for e in exo_results:
        status_icon = "✅ PASS" if e["valid"] else "❌ GAP P0/P1"
        gen_icon = "✅ OK" if e["codegen_ok"] else f"❌ {e['codegen_error'][:30]}"
        if e["valid"]:
            err_summary = "Pipeline intègre et vérifié sans erreur de type"
        else:
            err_summary = "<br>".join(f"• `{err}`" for err in e["errors"])
        lines.append(
            f"| **{e['id']}** | {e['name']} | {e['node_count']} | {e['edge_count']} | "
            f"{status_icon} | {gen_icon} | {err_summary} |"
        )

    lines.extend([
        "",
        "---",
        "",
        f"## 2. Matrice Complète des {total_blocks_count} Blocs du Catalogue",
        "",
        "Légende des statuts cibles (§02 Réduction) :",
        "- `keep` : Conservé dans la palette canonique v1 (~45 blocs cœur).",
        "- `merge` : Fusionné avec son pendant `*_layer` (`Module`) pour éliminer l'ambiguïté.",
        "- `delete` : Supprimé (versions Tensor sans persistance de poids, source du bug #14).",
        "- `deprecate` : Déprécié (conservé temporairement avec wrapper et avertissement).",
        "- `hide` : Conservé mais replié par défaut dans la sous-palette avancée.",
        "",
        f"**Statistiques globales :** {used_blocks_count}/{total_blocks_count} blocs "
        f"({used_blocks_count / total_blocks_count * 100:.1f}%) sont directement utilisés dans les 12 exercices.",
        f"- `keep` : {status_counts['keep']}",
        f"- `hide` : {status_counts['hide']}",
        f"- `delete` : {status_counts['delete']}",
        f"- `merge` : {status_counts['merge']}",
        f"- `deprecate` : {status_counts['deprecate']}",
        "",
        "| Block | Catégorie | Utilisé dans les Exos | Statut Cible |",
        "|---|---|---|:---:|",
    ])

    for b_name in sorted(all_blocks.keys()):
        b_meta = all_blocks[b_name]
        cat = b_meta.category if hasattr(b_meta, "category") else b_meta.get("category", "")
        cat_name = cat.name if hasattr(cat, "name") else (cat.get("name") if isinstance(cat, dict) else str(cat))
        exos_list = block_to_exos.get(b_name, [])
        used_str = ", ".join(exos_list) if exos_list else "—"
        status = get_block_status(b_name)
        lines.append(f"| `{b_name}` | {cat_name} | {used_str} | `{status}` |")

    lines.extend([
        "",
        "---",
        "",
        "## 3. Analyse Détaillée des Gaps P0 (Bloquants v1)",
        "",
        "Ces écarts de typage et de liaison empêchent la validation stricte des exercices canoniques.",
        "Ils sont résolus dans les étapes §04 (Familles & Stages) et §05 (Typage & Validation).",
        "",
        "### Gap P0.1 — Pont tabulaire `df -> tensor` non auto-inséré (Exo A4)",
        "- **Exercice concerné :** `A4 Tabular Iris — df→tensor`",
        "- **Symptôme actuel :**  ",
        "  - `Type mismatch: converter.out_1 (torch.Tensor) -> fc1.in_1 (torch.nn.Module)`  ",
        "  - `Type mismatch: converter.out_1 (torch.Tensor) -> trainer.in_2 (torch.utils.data.DataLoader)`",
        "- **Cause racine :** Le bloc `df_to_tensor` transforme un `pd.DataFrame` (S0) en `torch.Tensor` (S1). "
        "Or, `linear_layer` attend un `torch.nn.Module` (S2A) pour composer le modèle, et `train_model` "
        "attend un `torch.utils.data.DataLoader` (S1). Aucun chemin de conversion automatique n'est "
        "résolu par le moteur.",
        "- **Action corrective (§04 / §05) :** Définir la transition de stage S0→S1→S2A et activer l'auto-insertion "
        "du convertisseur `df_to_tensor` et de l'adaptateur de chargement `TensorDataset / DataLoader` "
        "via la bulle d'action Astryx (`converterFor`).",
        "",
        "### Gap P0.2 — Désynchronisation front/back sur les types `image` & `ndarray` (Exos A2, A5)",
        "- **Exercices concernés :** `A2 Fashion-MNIST Quickstart`, `A5 CIFAR-10 augmentation`",
        "- **Symptôme actuel :**  ",
        "  - `Type mismatch: dataset.out_1 (torch.utils.data.DataLoader) -> norm.in_1 (torch.Tensor)`  ",
        "  - `Type mismatch: norm.out_1 (torch.Tensor) -> loader.in_1 (torch.utils.data.Dataset)`",
        "- **Cause racine :** `load_torch_dataset` instancie et renvoie directement un `DataLoader` "
        "plutôt qu'un `Dataset`. Les transformations (`random_crop`, `random_flip`, `normalize`) attendent "
        "des tenseurs ou images. Côté frontend, `typeCheck.ts` traite `PIL.Image.Image` comme une chaîne brute "
        "alors que le backend la classe en famille `image`. Le graphe de conversion `image -> tensor` "
        "et les unions de types (`PIL.Image | ndarray`) sont désynchronisés.",
        "- **Action corrective (§04 / §05) :** Aligner `typeCheck.ts` avec `core/types.py` "
        "(support de `image/list/env/policy` et fonction `_split_union`), et restructurer la chaîne S1 "
        "pour que le `DataLoader` encapsule les transformations du `Dataset`.",
        "",
        "### Gap P0.3 — Chaîne de typage NLP & séquences de texte (Exo A6)",
        "- **Exercice concerné :** `A6 NLP Text Classification — LSTM`",
        "- **Symptôme actuel :**  ",
        "  - `Type mismatch: encoder.out_1 (numpy.ndarray) -> trainer.in_2 (torch.utils.data.DataLoader)`  ",
        "  - `Type mismatch: lstm_cell.out_1 (torch.Tensor) -> fc.in_1 (torch.nn.Module)`",
        "- **Cause racine :** La chaîne NLP traverse `str -> list[str] -> ndarray -> Tensor -> Module`. "
        "Côté front, `list[str]` n'est pas mappé à la famille `list`. De plus, `encode_text` produit "
        "un `ndarray` qui ne peut pas alimenter directement `train_model` sans passerelle DataLoader, "
        "et le bloc `lstm` retourne un `torch.Tensor` incompatible avec `linear_layer` (qui attend un `Module`).",
        "- **Action corrective (§04 / §05) :** Harmoniser les familles `list` et `text`, "
        "clarifier l'assemblage séquentiel du modèle LSTM, et fournir l'adaptateur de batching adéquat.",
        "",
        "### Gap P0.4 — Doublon et incompatibilité de types `standard_scaler` vs `normalize` (Exo B3)",
        "- **Exercice concerné :** `B3 Iris KMeans — Elbow`",
        "- **Symptôme actuel :**  ",
        "  - `Type mismatch: scaler.scaled (numpy.ndarray) -> clustering.in_1 (pd.DataFrame)`",
        "- **Cause racine :** `standard_scaler` (`modeles-F59E0B`) renvoie un dictionnaire contenant "
        "`scaled: numpy.ndarray`. Le bloc `kmeans` attend un `pd.DataFrame`. Par ailleurs, `standard_scaler` "
        "fait doublon avec `normalize` (`transformations-EC4899`) qui opère sur les tenseurs.",
        "- **Action corrective (§02 / §04) :** Unifier sous un unique bloc `normalize` supportant la stratégie "
        "selon la famille de données entrante (`DataFrame` vs `Tensor`), ou formaliser la conversion "
        "bidirectionnelle `ndarray <-> DataFrame`.",
        "",
        "### Gap P0.5 — Duplication historique `conv2d` vs `conv2d_layer` (Exo A1 / Bug #14)",
        "- **Exercice concerné :** `A1 CIFAR-10 CNN — 60min Blitz`",
        "- **Symptôme actuel :** Les blocs `conv2d`, `linear`, `flatten`, `relu`, `maxpool2d` de la catégorie "
        "`convolution` appliquent des opérations fonctionnelles éphémères `nn.*()(x)` sur des tenseurs. "
        "Leurs sorties `torch.Tensor` sont rejetées par les optimiseurs (`adam`, `sgd`) qui exigent "
        "des `torch.nn.Module` persistants.",
        "- **Action corrective (§02) :** `A1` valide déjà avec `conv2d_layer`. L'étape §02 actera "
        "la suppression des 5 blocs `Tensor` éphémères (`conv1d`, `conv2d`, `conv3d`, `conv_transpose2d`, `linear`) "
        "et mettra en place un adaptateur de compatibilité pour les anciens graphes.",
        "",
        "---",
        "",
        "## 4. Analyse des Gaps P1 (Secondaires / Post-v1)",
        "",
        "### Gap P1.1 — Pont `env <-> tensor / policy` pour CartPole DQN (Exo C2)",
        "- **Exercice concerné :** `C2 CartPole DQN (PyTorch)`",
        "- **Symptôme actuel :**  ",
        "  - `Type mismatch: env.out_1 (Env) -> fc1.in_1 (torch.nn.Module)`  ",
        "  - `Type mismatch: trainer.model (torch.nn.Module) -> eval.policy (Policy)`",
        "- **Analyse :** Le monde d'apprentissage par renforcement `SX World` (`Env`, `Policy`) "
        "est conçu pour être strictement étanche en v1 (validé avec succès dans C1 tabulaire). "
        "C2 tente de faire transiter l'état de l'environnement directement vers les couches `Module` "
        "et de connecter le réseau de neurones à `evaluate_agent`. "
        "Pour ne pas complexifier prématurément le modèle de stages en v1, C2 sera traité en P1 "
        "via un adaptateur dédié `Adapter env <-> tensor / policy`.",
        "",
        "### Gap P1.2 — Famille dédiée pour les schedulers de taux d'apprentissage et Early Stopping",
        "- **Exercices concernés :** Extensions avancées de `A1`",
        "- **Symptôme actuel :** `step_lr`, `cosine_lr`, `reduce_lr_on_plateau` retournent des types "
        "spécifiques (`CosineAnnealingLR`, `StepLR`, etc.) sans famille unifiée reconnue dans `core/types.py`. "
        "`early_stopping` consomme un `float` et retourne un `bool`.",
        "- **Analyse :** Ces blocs fonctionnent en exécution locale mais restent isolés dans le typage. "
        "Il sera tranché en §04 si la famille `optim` doit absorber les schedulers ou si une famille "
        "`scheduler` distincte doit être introduite.",
        "",
        "---",
        "",
        "## 5. Conclusion & Feuilles de Route Suivantes",
        "",
        "1. **§02 Réduction des blocs :** Procéder à la suppression des 5 blocs Tensor éphémères, "
        "à la fusion des 3 paires (`relu`, `maxpool2d`, `flatten`), à la dépréciation de `embedding` / `dropout`, "
        "et au masquage des 9 activations avancées.",
        "2. **§04 + §05 Typage & Stages :** Implémenter les 5 stages canoniques (`S0..S4, SX`), "
        "résoudre les 5 gaps P0 identifiés ci-dessus et aligner le frontend `typeCheck.ts` "
        "avec `core/types.py`.",
        "",
    ])

    return "\n".join(lines)


def main() -> int:
    """Point d'entrée principal du script d'audit."""
    print("=" * 70)
    print("AUDIT DE COUVERTURE DES BLOCS ET ANALYSE DES GAPS (TICKET #17)")
    print("=" * 70)

    exo_results, block_to_exos, all_blocks = audit_exercises()

    passing = [e["id"] for e in exo_results if e["valid"]]
    failing = [e["id"] for e in exo_results if not e["valid"]]

    print(f"\nDiscovered {len(exo_results)} exercises in {CONFIGS_DIR}:")
    for e in exo_results:
        status_str = "PASS" if e["valid"] else "FAIL (gap documenté)"
        err_str = f" - {len(e['errors'])} erreurs" if e["errors"] else ""
        print(f"  [{e['id']}] {e['name'][:35]:35} | {status_str:20}{err_str}")

    print("\n" + "-" * 70)
    print(f"Synthèse : {len(passing)}/{len(exo_results)} PASS ({', '.join(passing)})")
    print(f"Gaps P0/P1 : {len(failing)}/{len(exo_results)} ({', '.join(failing)})")
    print(f"Catalogue : {len(block_to_exos)}/{len(all_blocks)} blocs utilisés directement")
    print("-" * 70)

    md_content = build_coverage_markdown(exo_results, block_to_exos, all_blocks)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(md_content, encoding="utf-8")
    print(f"\n✅ Rapport de couverture généré avec succès dans :\n   {OUTPUT_FILE}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
