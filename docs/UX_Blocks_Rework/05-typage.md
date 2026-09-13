# 05 — Typage facile et sûr (Facade + State + Strategy)

> **But:** Garder `incompatible` qui bloque avant `generator.py`, mais le rendre **invisible** (auto-convert, messages humains). Facile ≠ `Any`.

## Principe

* **Sûr = types forts:** `classify(src, tgt, graph)` reste `compatible/convertible/incompatible` (`core/types.py:84-104` + `typeCheck.ts:44-49`). Jamais `Any` partout — sinon `adam(DataFrame)` passe `validate`, plante à `loss.backward()` à 40s sur Vast.
* **Facile = 1 Facade + auto-insert:** `convertible` (`df->tensor`) n'est plus une erreur rouge, c'est un `df_to_tensor` auto-inséré par `FlowCanvas` (via `converterFor` déjà présent côté front).

## Architecture (refactoring.guru, live fetch 2026-09-09)

| Pattern | Rôle | Fichier |
|---|---|---|
| **Facade** | 1 `TypeSystem.to_tensor(Any)->Tensor`, `canConnect()`, `suggest()` — seule API appelée par `validation.py`/`generator.py`/`FlowCanvas` | `core/type_system.py` + `utils/typeSystem.ts` |
| **State** | `Pipeline.stage` change `canConnect()` selon `S0..S4` (§04) | `core/stages.py` |
| **Strategy** | `ConversionStrategy` remplace `if family_of` en chaîne — ajouter `bfloat16` = nouvelle stratégie | `core/strategies/*.py` |
| **Adapter** | Pont `conv2d(Tensor) -> conv2d_layer(Module)` pour pipelines sauvegardés | `core/adapters.py` |
| **Template Method** | Squelette `validate→coerce→build→infer→execute` dans `BlockMeta` | `core/block.py` |

À éviter: `Abstract Factory`/`Composite` (recodifient les familles), `Null Object` (masque `None` qui doit planter).

## Changements concrets

1. **Facade unique:**

```py
# core/type_system.py
class TypeSystem:
    def family_of(self, dtype: str) -> Family: ...  # était core/types.py
    def build_graph(self, registry) -> Graph: ...    # était transformations-only
    def classify(self, src, dst) -> Verdict: ...    # union-aware + wildcard
    def stage_of(self, family) -> Stage: ...        # §04
    def can_connect(self, src, dst) -> tuple[Verdict, str|None]: ... # verdict + message humain
```

2. **Auto-insert `convertible` avec bulle de confirmation Astryx :**

Lors de la connexion de deux ports avec un verdict `convertible` (ex: `pd.DataFrame` → `torch.Tensor`), plutôt qu'une insertion silencieuse ou un blocage opaque, une **bulle de confirmation Astryx** (Popover / Dialog compact) apparaît à l'emplacement du curseur :
> *"Type convertible détecté : insérer automatiquement le bloc adaptateur **`df_to_tensor`** ?"*
> `[Insérer]` `[Annuler]`

```ts
// frontend/src/utils/typeSystem.ts / FlowCanvas.tsx
if (classifyEdge(src, dst, graph) === "convertible") {
  const conv = converterFor(src, dst, blocks) // existe: typeCheck.ts:52
  if (conv) {
    // Affiche la bulle de confirmation Astryx pour insérer le bloc adaptateur
    promptInsertConverter(conv, edge)
  }
}
```

3. **Sync front/back (P0):** ajoute `PIL.Image->image`, `list[->list`, `Env->env`, `Policy->policy` + `_split_union(' | ')` côté `typeCheck.ts` — sinon `to_tensor(PIL|ndarray)` faux. Test `test_types.py:114-120` doit passer côté front.

4. **Messages humains:** `validation.py:177` `Type mismatch: pd.DataFrame -> torch.Tensor` → `💡 Ajoutez 'df_to_tensor' entre 'load_csv' et 'linear_layer' (ou acceptez la suggestion d'insertion)`.

## Critères d'acceptation

* [ ] `TypeSystem` est la seule source de vérité (plus d'appel direct à `family_of` hors facade)
* [ ] `convertible` propose l'insertion via une bulle de confirmation Astryx, `incompatible` bloque avec suggestion (pas juste rouge)
* [ ] `familyOf` front == `family_of` back (test miroir `test_types` vs `typeCheck.test.ts`)
* [ ] `test_types` + `test_validation` + `portResolution.test.ts` verts, `ruff`/`eslint` verts
* [ ] Aucun `dtype: Any` ajouté — `any` reste wildcard `object/Any` seulement

## Dépendance avec §04

§04 et §05 touchent les mêmes 4 fichiers (`core/types.py`, `validation.py`, `typeCheck.ts`, `portResolution.ts`). Les séparer en 2 PRs = conflits. **Livrer en 1 PR** avec 2 commits: `feat(stages)` puis `feat(type-system-facade)`.

## Risques

* **Auto-insert qui cache une erreur sémantique:** `kmeans(df) -> cross_entropy(tensor)` est `incompatible` mais si tu auto-insères `df->tensor` puis `tensor->module` tu fabriques un faux positif. Garde `incompatible` sur changement de `Stage` divergent (S2B `model` ≠ S2A `module`).
