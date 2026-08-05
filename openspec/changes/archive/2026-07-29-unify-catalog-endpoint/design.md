## Context

Actuellement le frontend fait 3 appels distincts pour charger le catalogue :
- `GET /api/blocks/categories` → `{neural: ["relu"], ...}`
- `GET /api/blocks?page=1&size=100` → liste paginée des blocks
- `GET /api/blocks/{type}` × N → détail de chaque type

Les couleurs sont extraites du nom des dossiers backend (`neural_6366F1` → `#6366F1`) mais le frontend les ignore et utilise un `CATEGORY_META` hardcodé, décalé des vraies catégories.

## Goals / Non-Goals

**Goals:**
- Unifier le chargement du catalogue en 1 seul appel API
- Les couleurs des catégories viennent du backend (single source of truth)
- Supprimer le code d'adaptation frontend mort/décalé

**Non-Goals:**
- Ne pas changer la structure du store (`InternalCatalog`, `BlockDefMap`) pour minimiser l'impact frontend
- Ne pas toucher aux endpoints pipelines, jobs, validate

## Decisions

1. **Nouvel endpoint `GET /api/catalog`** plutôt que de modifier un existant
   - Alternative: modifier `GET /api/blocks` — mais c'est un breaking change de toute façon, mieux vaut un endpoint propre
   - La pagination des blocks est overkill (< 100 items), on vire

2. **Format de réponse imbriqué catégories → blocks**
   ```json
   {
     "categories": [
       {
         "id": "neural",
         "name": "neural",
         "color": "#6366F1",
         "blocks": [
           {
             "type": "relu",
             "label": "ReLU",
             "params": { "in_features": { "type": "int", "default": 512, ... } },
             "inputs": [{"name": "in_1", "dtype": "Tensor"}],
             "outputs": [{"name": "out_1", "dtype": "Tensor"}]
           }
         ]
       }
     ]
   }
   ```
   - Alternative: réponse plate `{categories: [...], blocks: {...}}` — moins pratique car il faut recouper cat→block côté frontend
   - L'imbrication permet au frontend de mapper directement sans recoupage

3. **Couleur extraite du dossier backend** (inchangé : `blocks/registry.py:_color_from_folder`)
   - Plus de `CATEGORY_META` hardcodé dans le frontend

4. **Adapter `fetchCatalog()` frontend** pour parser la nouvelle réponse
   - Transformer les `params` en `Segment[]` comme avant (même logique que `adaptParam`)
   - Garder `InternalCatalog` et `BlockDefMap` inchangés dans le store

5. **Supprimer les 3 anciens endpoints** (`GET /api/blocks`, `GET /api/blocks/categories`, `GET /api/blocks/{type}`)
   - `Block` schema et import deviennent inutilisés, à nettoyer

## Risks / Trade-offs

- **[Breaking change]** Frontend déjà déployé plante jusqu'au prochain déploiement → Mitigation: déployer backend et frontend en même temps
- **[Payload plus gros]** Un seul payload au lieu de N+1 appels — mais < 50 blocks, négligeable
- **[Perte de la pagination]** Si le catalogue dépasse 100 blocks un jour, faudra rajouter — acceptable aujourd'hui
