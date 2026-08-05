# Design: advanced-mode-params

## Context

Le mode avancé (ReactFlow) construit des graphes mais ne peut ni régler ni exécuter les hyperparamètres : `BlockNode` affiche `{k}: {v.type}` en lecture seule, le run avancé envoie `params: {}`, et `linearToFlow` reconstruit les params depuis les défauts du catalogue (les valeurs linéaires sont perdues). 62/65 blocs ont des params requis → le run avancé plante.

**Découverte pendant l'exploration** : il n'existe **aucune coercion de type** côté backend — `BlockMeta.execute` passe les params bruts à `_build_fn(**params)`. Or le frontend envoie toujours des **strings** (champs linéaires et segments). Vérifié empiriquement : `linear` avec `in_features: "4"` → `TypeError` (`nn.Linear`). **Le run linéaire avec des valeurs éditées est donc cassé lui aussi** — la coercion backend est la fondation, pas une option.

Contraintes : les types Python des params sont déjà introspectés (`ParamInfo.type` : int/float/bool/str/list/Literal/file), disponibles dans la spec v1 du `BlockRegistry` (`params[k]["type"]`). Les blocs restent des fonctions pures sans base class. Le mode linéaire est la référence UI (segments éditables).

## Goals / Non-Goals

**Goals:**
- Coercer les params strings → types déclarés à la frontière d'exécution (linéaire + avancé).
- Rendre les hyperparamètres éditables dans les nodes ReactFlow (mêmes segments qu'en linéaire).
- Préserver les valeurs à travers les conversions linéaire↔avancé.
- Envoyer les params des nodes au run avancé.

**Non-Goals:**
- Refonte du backend d'exécution (reste `execute(**params)`).
- Validation stricte des params (hors coercion de type) — la coercion échoue proprement en erreur de run.
- Édition de graphe avancée (déjà fonctionnelle).

## Decisions

### D1 — Coercion backend dans `BlockMeta.execute`
Avant `self._build_fn(**params)`, coercer chaque param selon `spec["params"][name]["type"]` : `int` → `int(v)` ; `float` → `float(v)` ; `bool` → `v in ("true", "True", "1", "1.0")` ; `list` → `json.loads(v)` (garde `ast.literal_eval` en fallback) ; `str`/Literal → inchangé ; `file` → inchangé (URL). `""`/`None` pour un param optionnel → `None`. Échec de coercion → `TypeError` clair (message avec nom du bloc et du param).
- *Pourquoi ici* : UNE seule frontière, fixe linéaire ET avancé, le type est déjà dans la spec v1.
- *Alternative* : coercion frontend — rejetée : le type Python est perdu dans les segments (`num` couvre int/float/bool), et ça dupliquerait la logique.

### D2 — Les nodes portent `segs` + `fields` (strings)
`data` du node gagne `segs: Segment[]` (depuis le catalogue) et `fields: Record<string, string>` (miroir des champs linéaires). Le champ `params` (`segsToParams`) disparaît des nodes — `BlockNode` rend `<BlockSegments segs fields blockId onUpdate>` (réutilisation directe : num → input, sel → select, file → upload supabase). Le rendu texte `{k}: {v.type}` est supprimé.

### D3 — Préservation à travers les conversions
- `linearToFlow` : `fields: b.fields` (les valeurs éditées) au lieu des défauts du catalogue.
- `flowToLinear` : lit `data.fields` au lieu de `data.params[].default` — les valeurs éditées en avancé survivent à la bascule.

### D4 — Store : `updateFlowParam(nodeId, k, v)`
Met à jour `flowNodes[i].data.fields[k]` (fonctionnel, immuable). Même sémantique que `updateField` linéaire.

### D5 — Runner avancé envoie les fields
`useBlockRunner` (branche advanced) : `params: node.data.fields ?? {}` au lieu de `{}`. Les strings passent par la coercion D1.

## Risks / Trade-offs

- **Coercion bool** : les défauts linéaires sont `"true"`/`"false"` — la règle `v in ("true","True","1")` couvre les deux.
- **`int | None`** (`max_depth`) : `""` → `None` ; sinon `int(v)`. Les `None` Python (annotation `"int | None"`) restent `None`.
- **`list[int]`** (`input.shape`) : `json.loads("[1, 28, 28]")` ✓ ; string brute → fallback `ast.literal_eval`.
- **Régression potentielle** : les runs existants passaient des strings SANS coercion — si un run "fonctionnait" par accident avec un string acceptable par le bloc (ex. `str`), D1 ne change rien (str → str). Les blocs torch avec strings plantaient déjà → D1 ne peut que réparer.
- **Le param `file`** reste une URL string — jamais coercé (le bloc `load_csv` le consomme tel quel).
