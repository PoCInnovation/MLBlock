## Why

La palette du mode avancé liste 64 blocks sur 9 catégories en une seule liste scrollable. La catégorie `neural` à elle seule a 33 blocks — trouver un block précis exige un scroll interminable. Il faut une recherche par nom et un filtre par catégorie pour retrouver un block rapidement.

## What Changes

- Ajout d'un input de recherche dans `FlowPalette.tsx` qui filtre les blocks par nom en direct
- Ajout de chips de catégorie (`Tous`, `neural`, `data`, ...) pour filtrer par catégorie
- Les deux filtres se combinent (query + catégorie)
- État local `useState` dans le composant — pas de persistance, pas de store

## Capabilities

### New Capabilities
- `flow-palette-search-filter`: recherche et filtre par catégorie dans la palette du mode avancé

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `FlowPalette.tsx` uniquement — ~40 lignes ajoutées (état local + UI recherche/filtres + logique de filtrage)
- **Aucun changement backend ou store**
