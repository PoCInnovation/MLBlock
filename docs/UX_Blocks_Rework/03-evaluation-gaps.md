# 03 — Évaluer couverture & combler les gaps

> **But:** Prouver que les 88 blocks actuels **suffisent** pour les 12 exos §01, et lister ce qui manque (P0/P1) **avant** de couper (§02). Ce fichier dépend de [01-exercices-reference](./01-exercices-reference.md).

## Méthode

Matrice `exo (12) × block_path (88)` binaire `✓/✗/proxy`.

Pour chaque exo §01:

1. Tente `validation.validate(pipeline)` + `generator.generate_code(nodes, edges)` + exécution `local` dry-run.
2. Si `incompatible` ou `raise NotImplementedError` → gap P0 (bloque exo P0) vs P1 (nice-to-have).
3. Tri P0 en tête.

```py
# scripts/audit_coverage.py à créer
for exo in exos:  # 12 DAGs de 01
    result = validate(to_payload(exo))
    gaps.append((exo.id, result.errors))
```

## Gaps attendus (actualisés 2026-09-11 d'après 01)

| Gap | Exo impacté | Symptôme actuel | Fix P0 | Dépend |
|---|---|---|---|---|
| `df -> tensor` non auto-inséré | **A4 Iris df→tensor** (nouveau) | `load_sklearn_dataset(pd.DataFrame, S0) -> linear_layer(tensor, S2A) = incompatible` — pas de `convertible` visible | §05 auto-insert `df_to_tensor` via `converterFor` | §04 Stage S0→S1 |
| `PIL.Image \| ndarray -> tensor` front désync | **A2 Fashion-MNIST, A5 augm** | `familyOf("PIL.Image.Image")` front = raw string, back = `image` → graphe `image→tensor` manquant côté front | §04+5 sync `typeCheck.ts` (`image/list/env/policy` + `_split_union(' \| ')`) | §05 |
| `conv2d` vs `conv2d_layer` (#14) | **A1 CIFAR-10 CNN** | Poids éphémères `nn.Conv2d()(x)`, `adam(Module)` refuse `tensor` | §02 `delete` Tensor + `Adapter conv2d→conv2d_layer` | §02 |
| `sequence_dataset` union `df\|ndarray → dataset` | **A7 Time-series** | `build_conversion_graph` front ne split pas ` | ` → `PIL \| ndarray → tensor` ignoré | §05 fix `_split_union` front |
| `tokenize→build_vocab→encode_text→embedding` chaîne `str→list→dict→ndarray→tensor` | **A6 NLP LSTM** | `tokenize: str→list[str]` front `list[str]` reste raw (back `list`), `encode_text: list[str]→ndarray` désync | §05 + vérif `embedding` attend `tensor` ou `list`? | §05 |
| `standard_scaler` vs `normalize` doublon | **B3 KMeans** | `standard_scaler(df→dict)` + `normalize(tensor→tensor)` — même étape S1/S2B, familles différentes | §02 fusionner en 1 block `normalize` avec `strategy` par family | §02 |
| `early_stopping / reduce_lr / scheduler` family manquante | **A1 P1** | `step_lr/cosine_lr` retournent `Any`? Pas de `family=scheduler` → isolé | Décider: `optim` suffit ou nouvelle family `scheduler` (P1, pas bloquant) | §04 |
| `CartPole DQN` pont `env↔tensor` | **C2 DQN (P1)** | `SX World (env/policy)` isolé par design pour C1 (P0 tabular). `C2` veut `env→tensor→module→policy` — casse l'isolement strict de SX | §04 variante `C2` avec pont explicite `Adapter env→tensor` (P1, reporté après v1) | §04 |

## Nouveaux gaps apportés par la recherche web

* **A3 "What is torch.nn really?"** n'est pas un gap mais révèle que l'exo pédagogique *explique* pourquoi `Module` > `Tensor` — à garder comme exo de référence pour justifier #14.
* **C1 vs C2 RL :** `C1 CartPole Tabulaire` est le standard P0 (`SX` 100% isolé). `C2 DQN` (pytorch.org DQN tuto) est classé P1 : il nécessite un `Adapter env ↔ tensor` explicite pour ne pas casser prématurément le modèle de stages en v1.

## Sortie

* `docs/UX_Blocks_Rework/coverage.md` — table 12×88 + 5-10 gaps triés P0/P1
* Issues GitHub par gap P0 (`gh issue create --label needs-triage`)
* Liste `new_blocks` à implémenter (max 3-5, ex: `maxabs_scaler` si vraiment manquant)

## Critères d'acceptation

* [ ] 12 exos §01 rejoués en `validate` + `generate_code` — rapport `pass/fail` commité
* [ ] 0 gap P0 ouvert avant §04+5 (ou ADR qui acte report P1)
* [ ] Nouveaux blocks ont `family` + `stage` + test `test_types` + doc FR

## Risque si fait après §02

Avec l'ordre adopté `1→3→2`, ce fichier s'exécute **avant** la coupe — pas d'aller-retour `delete→restore`.
