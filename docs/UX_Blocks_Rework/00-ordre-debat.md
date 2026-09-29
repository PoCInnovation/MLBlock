# 00 — Débat sur l'ordre — DÉCISION PRISE 2026-09-11

> **Décision:** Ordre recommandé adopté — `1 → 3 → 2 → 4+5`. Ce fichier garde le débat pour traçabilité.

## Ordre adopté

```
1. Exercices référence (torch/sklearn/RL) — 12 DAGs sourcés pytorch.org / scikit-learn.org / gymnasium.farama.org
3. Évaluer gaps (avec 88 blocks actuels) — matrice 12×88, gaps P0/P1
2. Réduire blocks (88→~45) — avec matrice en main, hide/deprecate puis delete
4+5. Familles + Typage — 1 chantier, 2 livrables (Stage 0..4 + Facade TypeSystem)
```

## Pourquoi 1→3→2→4+5 et pas 1→2→3→4→5

| Question | Ton ordre `1→2→3` | Ordre adopté `1→3→2` | Tranché |
|---|---|---|---|
| **Q1 — Réduire avant de savoir quoi garder?** | Coupe `conv2d` puis §3 révèle que MNIST l'utilisait → restore, 1 PR annulée | §3 avec 88 blocks dit `conv2d` inutilisé (tous exos utilisent `conv2d_layer`) → coupe sûre | ✅ `1→3→2` |
| **Q2 — Dépendance topologique** | `S1→S2` et `S2→S3` n'existe pas, Kahn dirait cycle | `S1→S3` (exos fixent besoin), `S3→S2` (coverage dit quoi garder) → trié | ✅ `1→3→2` |
| **Q3 — §4 et §5 séparables?** | 2 PRs sur mêmes fichiers (`core/types.py`, `validation.py`, `typeCheck.ts`, `portResolution.ts`) | 1 PR en 2 commits `feat(stages)` puis `feat(type-system-facade)` | ✅ `4+5` fusionné |
| **Q4 — Familles avant typage?** | Familles = vocabulaire produit, typage = implémentation | Itératifs — 1 ADR `0001-staged-typing` couvre Stage+Facade ensemble | ✅ ADR unique |
| **Q5 — Où valider "exos passent"?** | Seulement à §3 et §5 | Gate `validate` après chaque étape (baseline 88 → gaps → 45 → palette filtrée) | ✅ Gates continus |

## Compromis écarté

`1→2(dry-run)→3→2(delete)→4+5` (garder ton ordre sans risque, `hide` seulement en §2) — écarté car ajoute 1 PR pour rien. `1→3→2` est plus court.

## Gates continus adoptés

* Après §1: `exo.validate()` vert avec 88 blocks (baseline)
* Après §3: `exo.validate()` vert avec gaps documentés (ou P0 ouverts)
* Après §2: `exo.validate()` vert avec 45 blocks
* Après §4+5: `exo.validate()` vert + palette filtrée par stage + auto-insert `convertible`

## Référence

* Recherche web 2026-09-11: `pytorch.org/tutorials` (CIFAR-10 Blitz, Fashion-MNIST Quickstart, MNIST nn_tutorial, DQN), `scikit-learn.org` (load_iris, PCA Iris, LogisticRegression), `gymnasium.farama.org` (CartPole-v1). Détail en [01-exercices-reference](./01-exercices-reference.md).
