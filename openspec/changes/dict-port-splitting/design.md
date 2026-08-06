# Design: dict-port-splitting

## Context

La mécanique des multi-sorties est en place depuis type-checking-conversions : `_parse_return_annotation` gère `tuple[A, B]` → `out_1`/`out_2`, `BlockMeta.execute` retourne les dicts tels quels, `Pipeline._value_for` résout par port, l'UI rend N handles sources et le classifieur type chaque port. `pca`, `standard_scaler` et `train_model` retournent des dicts dont les clés correspondent naturellement à des ports (`{"model": ..., "transformed": ...}`) — seule la déclaration manque (`-> "dict"` brut → `out_1: dict`).

Valeur : `pca.transformed`/`scaler.scaled` (ndarray) → `to_tensor` (existe, in: numpy.ndarray) → monde torch ; `train_model.model` (torch.nn.Module) → `sgd`/`adam`.

## Goals / Non-Goals

**Goals:**
- Parser `dict[name: type, ...]` dans l'annotation de retour → ports nommés/typés.
- Annoter les 3 blocs dict.
- Compatibilité : `-> "dict"` nu inchangé.

**Non-Goals:**
- Changement runtime/UI/classifieur (aucun besoin — mécanisme tuple réutilisé).
- Éclatement des dicts non structurés (`random_split` déjà converti en tuple).

## Decisions

### D1 — Grammaire `dict[name: type, name: type]`
`_parse_return_annotation` : branche `^dict\[(.+)\]$` → `_split_top_level` (existant) → chaque entrée `name: dtype` (split sur le premier `:`) → `outputs = [{name, dtype}...]`. Les noms de ports = les clés du dict retourné par le bloc.
- String annotation → `get_type_hints` échoue → fallback raw (chemin tuple éprouvé).
- `dict` sans crochets ou vide → comportement actuel (`out_1: dict`).

### D2 — Annotation des 3 blocs
- `pca` : `-> "dict[model: Model, transformed: numpy.ndarray]"`
- `standard_scaler` : `-> "dict[scaler: object, scaled: numpy.ndarray]"` (scaler = transformer sklearn → `object`, famille any/identité)
- `train_model` : `-> "dict[model: torch.nn.Module, history: list]"` (history = liste de pertes, famille list — terminal, honnête)

### D3 — Aucun changement runtime
`execute` (dict → tel quel), `_value_for` (`val[port]` si clé, sinon dict entier), UI (handles N), classifieur (familles existantes : ndarray/module/model/object/list) — tout fonctionne déjà.

## Risks / Trade-offs

- **Clé manquante au runtime** : `_value_for` retombe sur le dict entier (silencieux) — acceptable v1, le run échouera naturellement chez le consommateur.
- **`history: list`** : pas de consommateur — rouge honnête, port déclaré quand même (cohérence).
- **Build endpoint** : un pipeline qui *termine* sur un bloc dict échoue (« pas de sortie tensor ») — comportement actuel, pas une régression.
- **Duplicata de clés** : dédupliqués (dernier gagne) — cas théorique.
