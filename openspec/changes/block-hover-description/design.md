# Design: block-hover-description

## Context

`Block.description` (Pydantic, `mlblock/server/schemas.py`) contient la docstring complète — 1re ligne = label FR, puis `Args:`. La route `/api/catalog` n'envoie ni le champ ni un résumé. Le frontend (palette + `BlockNode`) n'a que `label`.

## Goals / Non-Goals

**Goals:**
- Phrase FR « ce que fait le bloc » par bloc, dans la docstring.
- Exposée via `/api/catalog` (`description` sur chaque block).
- Tooltip au survol : items de palette + label des nodes.

**Non-Goals:**
- Description par param dans le tooltip (déjà en `title` sur les champs).
- Refonte du contenu des docstrings (Args conservées).

## Decisions

### D1 — Docstring : phrase de description après le label
Structure : `"""Label.\n<Phrase FR ce que fait le bloc.>\n\nArgs:\n..."""` — la phrase est la 2e ligne (si vide → fallback au label). 65 phrases FR ajoutées (une par bloc, via patch scripté).

### D2 — Backend : `_fr_summary(block)` + route
`routes.py` : helper `_fr_summary` extrait la 2e ligne non vide de la docstring (après le label, avant `Args:`) ; la route ajoute `"description": _fr_summary(block)` au payload. `Block.description` reste la source (Pydantic — pas de nouveau champ).
- *Alternative* : envoyer la docstring brute — rejeté (le frontend devrait parser ; Args redondantes avec les labels de params).

### D3 — Frontend : tooltips
- `catalog.ts` : `BlockDef.description: string` ; `schemas/api.ts` : champ optionnel ; `toSegments` inchangé (propagation dans `fetchCatalog`).
- `FlowPalette` : `title={desc}` sur l'item draggable.
- `BlockNode` : `title={desc}` sur le label (les nodes montrent aussi la description au survol).
- Fallback : description vide → pas de tooltip (ou label).

## Risks / Trade-offs

- **65 phrases à écrire** : patch scripté (comme les labels) avec phrases courtes ; fallback label si oubli.
- **Tooltip natif** : `title` — simple, pas de composant custom (cohérent avec le reste).
- **Perf** : une chaîne par bloc dans le catalogue — négligeable.
