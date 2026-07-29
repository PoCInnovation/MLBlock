## Why

Frontend fait N+2 appels API pour charger le catalogue de blocks, et les couleurs des catégories sont hardcodées dans le frontend (décalées des vraies couleurs du backend). Un seul endpoint avec couleurs embarquées simplifie le code, réduit la latence et élimine la divergence de couleurs.

## What Changes

- **BREAKING**: Supprime les 3 endpoints `/api/blocks*` au profit d'un seul `GET /api/catalog`
- **BREAKING**: Le frontend passe de N+2 appels à 1 appel pour charger le catalogue
- Les couleurs des catégories viennent du backend (nom du dossier, ex: `neural_6366F1`)
- Simplification du code frontend : suppression de `adaptBlockDetail`, `adaptCategories`, `fetchBlockDetail`, et de la pagination des blocks

## Capabilities

### New Capabilities
- `unified-catalog`: Endpoint unique `GET /api/catalog` retournant catégories (id, name, color) et blocks (type, label, params, inputs, outputs) en une seule réponse

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Backend**: `routes.py` — remplacement de 3 endpoints par 1, suppression de l'import `Block` inutilisé
- **Frontend**: `api/client.ts` — réécriture de `fetchCatalog`, suppression des fonctions d'adaptation. `types/catalog.ts` — simplification des types. `EditorPage.tsx` — inchangé (appelle toujours `fetchCatalog`)
- **Déploiement**: Frontend à rebuild/déployer (breaking change)
