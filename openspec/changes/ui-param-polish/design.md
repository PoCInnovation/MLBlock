# Design: ui-param-polish

## Context

`BlockNode` (avancé) : les handles de sortie n'ont que `title` (tooltip) — noms invisibles. `BlockSegments` (linéaire + avancé) : les champs s'affichent nus (input/select/checkbox sans nom). La convention docstring FR existe (`entre:`, `choix:`, `format:`, `longueur:` — parsée dans `ParamInfo`) et les docstrings sont majoritairement FR (enrichies par block-param-intelligence). Les labels du catalogue viennent de `block.name.replace("_", " ").title()` (routes.py) — anglais. Le frontend a une mécanique datalist déjà prouvée (`choix:` + colonnes CSV).

## Goals / Non-Goals

**Goals:**
- Noms des ports de sortie visibles dans les nodes avancés.
- Noms des params visibles à côté de chaque champ (les deux modes).
- Suggestions de valeurs par docstring → datalist.
- Labels de blocs en français.

**Non-Goals:**
- Refonte du layout des nodes (positions des handles, connexions).
- Autocomplétion dataflow supplémentaire (colonnes CSV — déjà en place).
- Traduction du code backend (messages d'erreur déjà FR).

## Decisions

### D1 — Sorties visibles (BlockNode)
Sous la zone des params, une ligne par sortie : `out_1 · pd.DataFrame` (nom + dtype, font 11, `textMuted`). Le handle source reste tel quel (point de connexion). Les entrées restent en tooltip (le handle cible est à gauche, le label à droite ne s'alignerait pas) — cohérent avec la lecture gauche→droite.
- *Alternative* : étiquettes flottantes collées aux handles — rejeté (positionnement ReactFlow fragile).

### D2 — Params nommés (BlockSegments)
Chaque champ reçoit un label `s.k` (font 11, semi-bold) avant le contrôle. Affiché dans les deux modes (composant partagé). Les segments `text` (le nom du bloc) restent inchangés. Espacement : `gap` existant, label + champ en inline-flex.
- Le label montre le **nom technique** (`ratio`, `shuffle`) — pas de traduction des noms de params (l'outil est technique, et les noms sont les identifiants API).

### D3 — Suggestions docstring
Nouvelle clé `(suggestions: a|b|c)` dans la grammaire existante → `ParamInfo.suggestions: list[str]` → segment avec `opts`. Rendu : champ `type=text` + `<datalist>` quand `suggestions` présentes (les datalist ne fonctionnent pas sur `type=number`). L'input reste libre (suggestions ≠ contrainte — pas de validation rouge).
Docstrings à enrichir : compteurs (`out_channels`: 16|32|64|128|256, `hidden_size`: 32|64|128|256, `embed_dim`: 64|128|256|512…), probabilités (`p`/`dropout`/`ratio`: 0.1|0.25|0.5|0.75|0.9), `kernel_size` (1|3|5|7), `shape` ([1, 28, 28]|[3, 32, 32]|[1, 3, 224, 224]).
- *Pourquoi docstring* : même convention que `(choix:)`, découverte automatique, aucune table côté frontend.

### D4 — Labels FR depuis les docstrings
Le catalogue (routes.py) construit le label : 1re ligne de la docstring FR si elle ne commence pas par « Parameter »/vide, sinon `name.title()`. Docstring « Charger un CSV. » → label « Charger un CSV ». Les docstrings à compléter (celles qui disent encore « Parameter. ») reçoivent une 1re ligne FR courte.
- *Alternative B* : table de traduction name→FR — rejetée (duplication, 30 entrées à maintenir).
- *Alternative C* : ligne `label:` — rejetée (une convention de plus).
- Le frontend reçoit le label via le catalogue (déjà propagé dans `BlockDef`/`label` des nodes et la palette).

## Risks / Trade-offs

- **Espace dans les blocs** : labels de params + suggestions + sorties → nodes plus larges. Mitigation : font 11, `minWidth` adaptatif (déjà 180), `maxWidth` conservé.
- **Datalist sur text** : perte du `type=number` (spinners) quand suggestions présentes — compromis assumé (suggestions > spinner).
- **Labels FR depuis docstring** : une docstring mal formée → fallback `name.title()` — jamais bloquant. Les tests de découverte couvrent le fallback.
- **Noms de params non traduits** : choix assumé (identifiants API), la description FR reste en tooltip.
