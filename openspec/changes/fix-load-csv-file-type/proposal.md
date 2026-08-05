## Why

Le block `load_csv` a son param `path` typé `"str"` dans l'annotation Python. Le backend envoie donc `type: "str"` au frontend, qui rend un champ texte. Il faut que ce soit `type: "file"` pour déclencher le file picker et l'upload Supabase Storage.

## What Changes

- Changer l'annotation de `load_csv(path: "str")` vers `load_csv(path: "file")` dans le block

## Capabilities

### New Capabilities
<!-- Aucune nouvelle capability -->

### Modified Capabilities
<!-- Aucune spec existante modifiée -->

## Impact

- **Block**: `blocks/data_22C55E/load_csv.py` — 1 caractère changé
- **Registre**: `registry.py` lit l'annotation string, déduit `ptype = "file"` automatiquement — aucun changement
- **Frontend**: `toSegments()` détecte `type: "file"` et rend le file picker — déjà implémenté
- **Code généré**: `pd.read_csv(path)` reçoit l'URL Supabase — marche déjà
