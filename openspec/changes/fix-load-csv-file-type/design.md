## Context

Le registre de blocks (`_inspect_function`) utilise l'annotation de type Python pour déterminer le type du param. `path: "str"` → `ptype = "str"`. Le frontend attend `ptype = "file"` pour afficher le file picker. Solution : `path: "file"` → `ptype = "file"`.

## Goals / Non-Goals

**Goals:**
- Le param `path` du block `load_csv` est rendu comme un file picker dans le frontend

**Non-Goals:**
- Ne pas changer le comportement d'exécution (`pd.read_csv` reçoit toujours une string)
- Ne pas toucher au registre (il lit l'annotation, c'est tout)

## Decisions

1. **Changer l'annotation du param** de `"str"` à `"file"` dans `load_csv.py`
   - Le registre à ligne 72 fait `ptype = ann_str` → reçoit `"file"` directement
   - Aucun changement dans `registry.py` ni dans `schemas.py`
   - Le code généré reste `pd.read_csv(path)` — l'URL Supabase est une string valide

## Risks / Trade-offs

- Aucun — l'annotation n'est utilisée que pour le typage UI, pas pour l'exécution
