# Design: type-checking-conversions

## Context

L'écosystème actuel : 64 blocs découverts par introspection (`blocks/registry.py`) depuis les annotations de fonctions. `outputs` est dérivé de l'annotation de retour ; `inputs` n'est **jamais dérivé** (toujours `[]`). Le frontend reçoit `inputs`/`outputs` via `/api/catalog` mais les **jette** (`fetchCatalog` → `BlockDef { cat, segs }`). `PipelineDef.validate_dtype_compatibility` existe mais n'est jamais instancié — et crasherait (StopIteration) car `inputs` est vide. `Pipeline.run` ignore `source_port` (une valeur par nœud). Le mode linéaire envoie `edges: []` → chaque bloc tourne isolément avec un tenseur factice. Le build donne des tenseurs factices aux nœuds racines.

Contraintes : blocs = fonctions pures sans base class, découverte 100 % automatique (un nouveau fichier `.py` suffit), la frontière sklearn/torch est franchie par des blocs convertisseurs **explicites et honnêtes** (pas de coercition magique dans le générateur), UI à feu tricolore avec décisions utilisateur actées (orange = bouton Convertir → matérialise le nœud ; rouge = connexion bloquée + toast).

## Goals / Non-Goals

**Goals:**
- Dériver les ports d'entrée depuis les signatures ; parser `tuple[A, B]` en sorties multiples.
- Classifieur de compatibilité à 4 sorties, dérivable du catalogue (pas de table codée en dur côté client).
- Validation dtype effective côté serveur (`/api/validate` + build) sur la base des familles.
- Blocs convertisseurs explicites (`df_to_tensor`), `to_tensor` honnête.
- Réparer les 5 blocs cassés.
- UI : arêtes colorées, toast, bouton Convertir, multi-handles, connecteurs implicites en mode simple.

**Non-Goals:**
- Multi-sorties pour les dicts hétérogènes (`pca`, `standard_scaler`, `train_model`) — restent mono-sortie `dict` (types des valeurs inconnus des annotations). v2.
- Bloc `predict` (`Model + df → df`) — v2, le chaînage sklearn aval n'a pas de consommateur critique aujourd'hui.
- Coercition silencieuse de types dans le code généré — jamais.
- Changement de la sémantique de run du mode linéaire (le chaînage réel reste hors scope ; le check est un avertissement).

## Decisions

### D1 — Règle de dérivation des inputs
Un paramètre est un port de données si : nom `in_<chiffres>` (préfixe `in_` suivi de chiffres — évite `in_features`/`in_channels`) ; OU annotation dans l'ensemble des familles data (`pd.DataFrame`, `torch.*`, `Model`, `object`, `tuple[...]`, `numpy.*`). Le dtype du port vient de l'annotation **brute** (string) — `get_type_hints` perd le préfixe module (`torch.Tensor` → `Tensor`). Tout le reste (int/float/bool/str/list/Literal/file) est un hyperparamètre.
- *Pourquoi* : `train_epoch(in_1..in_4)` et `evaluate(model, test_data, …)` ont des ports hors convention `in_` ; la règle couvre les deux sans renommer les paramètres visibles dans l'UI, et `input(shape)`/`load_csv(path)` n'exposent aucun port.
- *Alternative* : renommer tous les ports en `in_N` — rejeté, dégrade les labels UI.

### D2 — Multi-sorties par annotation tuple
`-> "tuple[A, B]"` (split au niveau top, profondeur gérée) → `out_1: A`, `out_2: B`. La fonction retourne un tuple ; `BlockMeta.execute` normalise `{out_1: v0, out_2: v1}` quand `len(outputs) > 1` et que le résultat n'est pas déjà un dict.
- *Pourquoi* : zéro nouvelle API, la convention est déjà dans le code (`train_test_split`).
- *Risque assumé* : un bloc qui voudrait retourner un tuple comme **valeur unique** serait éclaté — aucun bloc actuel ne le fait.

### D3 — Résolution par port dans `Pipeline.run`
```python
def _value_for(outputs, node_id, port):
    val = outputs.get(node_id)
    return val[port] if isinstance(val, dict) and port in val else val
inputs[edge.target_port] = _value_for(outputs, edge.source, edge.source_port)
```
`source_port` devient réel. Les dicts mono-sortie (pca) continuent de passer tels quels.

### D4 — Familles de types et classifieur 4 sorties
Familles observées : `tensor`, `df`, `model` (Model/object), `dict`, `dataset`, `module`, `optim`, `scalaire`. Classification d'une connexion `A.out → B.in` :
1. **identité** — même dtype → vert
2. **sous-type** — A ⊂ B (tout → `object`/`Any`, widening `int → float`) → vert
3. **convertible** — un bloc du catalogue a `in-family ≠ out-family` et un chemin existe (BFS sur le graphe de conversion) → orange
4. **incompatible** — aucun chemin → rouge

Le graphe de conversion est **dérivé du catalogue** : seuls les blocs de la catégorie `transforms` contribuent des arêtes (direction entrée → sortie) — cette catégorie est la convention du repo pour les blocs-ponts (`to_tensor`, `df_to_tensor`). Les blocs d'entraînement/évaluation multi-entrées (`train_epoch`, `evaluate`) et les fit sklearn (sortie `object`/`Model`) ne sont **pas** des convertisseurs malgré des familles hétérogènes. Pas de table client codée en dur.
- *Pourquoi* : un bloc "1 entrée ≠ 1 sortie" naïf créerait des arêtes mensongères (df→model via random_forest, module→scalar via train_epoch).
- *Pourquoi BFS plutôt que table* : le graphe est minuscule (<10 nœuds), BFS trivial, et le catalogue reste la seule source de vérité.

### D5 — Convertisseurs v1
- `df_to_tensor(in_1: "pd.DataFrame") -> "torch.Tensor"` : `torch.from_numpy(in_1.values.astype("float32"))`. Nouveau fichier, découverte automatique.
- `to_tensor` : annotation resserrée `object` → `numpy.ndarray` (corps inchangé — ToTensor accepte ndarray). Le wildcard `object` disparaît du graphe de conversion.

### D6 — Validation serveur réanimée
`validate_dtype_compatibility` branche le classifieur (D4) au lieu de l'égalité stricte. Branchée sur `/api/validate` (via `PipelineDef(registry=…)` ou appel direct) et au build : **rouge → erreur ; orange → autorisé** (le convertisseur est matérialisé côté UI avant le run ; si absent, le build échoue naturellement sur le code généré).

### D7 — UI feu tricolore
- Catalogue enrichi : `BlockDef` gagne `inputs`/`outputs` (`{name, dtype}[]`), propagés par `fetchCatalog` (le schéma zod les parse déjà).
- `BlockNode` multi-handles : N targets (`in_1..in_N`), M sources (`out_1..out_M`), id + tooltip dtype. ReactFlow gère déjà `sourceHandle`/`targetHandle`.
- `onConnect` intercepté : classifieur local (D4, graphe dérivé du catalogue) →
  - vert : edge créé ;
  - orange : edge **pas** créé, toast actionnable « Convertir » → insère le bloc convertisseur au point milieu + câble `A.out → conv.in`, `conv.out → B.in` (chaque edge re-classifié) ;
  - rouge : edge pas créé, toast erreur.
- Rendu : tous les edges (y compris chargés/hérités) sont colorisés par classification — vert `success`, orange `convert` en pointillés (`strokeDasharray`), rouge `error`. Le orange n'est donc jamais créé par le drag mais peut apparaître sur des edges hérités.
- Toast : léger, store zustand (`{ kind: 'error' | 'convert', message, action? }`), auto-dismiss 4 s, `role="alert"`, rendu top-right.
- Couleurs + symboles (accessibilité) : vert `success` + ●, orange `#F59E0B` (nouveau token `convert`) + ⚡, rouge `error` + ✗ ; edge orange en pointillés (`strokeDasharray`).
- Mode simple : connecteur implicite `out_1(N) → in_1(N+1)` coloré entre blocs ; orange → bouton « Insérer convertisseur » inter-blocs ; rouge → badge incompatible.

### D8 — Réparations de blocs
- `linear_regression`, `logistic_regression`, `random_forest` : `train_target` → `train_data[target_column]`.
- `evaluate` : réécriture — `X = test_data.drop(columns=[target_column])`, `y_true = test_data[target_column]`, `method` réel (`mse` → MSE, sinon accuracy), retour `float`.
- `train_test_split` : réécriture complète — `dataset` DataFrame, `ratio`/`shuffle`/`seed` appliqués via `sklearn.model_selection.train_test_split`, retour `(train, test)`, annotation `-> "tuple[pd.DataFrame, pd.DataFrame]"` → éclaté `out_1: train`, `out_2: test` (D2/D3).
- `random_split` : retour `(train, test)` au lieu du dict, annotation `-> "tuple[torch.utils.data.Dataset, torch.utils.data.Dataset]"`.

## Risks / Trade-offs

- **`object`/`Any` wildcard** : sous-type universel → beaucoup de vert apparent. Accepté : `to_tensor` resserré (D5) limite la casse ; le run reste la vérité finale.
- **Dicts terminaux** : `pca`/`scaler`/`train_model` connectés = rouge. Honnête mais frustrant — mitigé en v2 par les multi-sorties typées.
- **Mode simple, règle `out_1`** : chaîne implicite prend la première sortie d'un bloc multi-sorties (`train` de `train_test_split`). Arbitraire mais documenté ; v2 = sélecteur de port.
- **BFS multi-étapes** : un chemin A→B→C insère 2 convertisseurs d'un coup. Rare, mais à tester (2 convertisseurs dans le catalogue v1).
- **Régression run linéaire** : le check ne change pas la sémantique d'exécution (non-goal) — risque de confusion « je vois du rouge mais ça tourne ». Mitigé : message du toast explicite.
- **Blocs réécrits** (`evaluate`, `train_test_split`) : comportement de sortie change (tuple au lieu de dict pour split) — aucun consommateur actuel, mais l'API catalog change (`outputs` à 2 ports).
