## 1. Backend

- [x] 1.1 Ajouter la phrase FR de description (2e ligne) dans les 65 docstrings (patch scripté)
- [x] 1.2 `routes.py` : `_fr_summary(block)` (2e ligne non vide, fallback label) + `"description"` dans le payload catalogue
- [x] 1.3 Test backend : description exposée + fallback

## 2. Frontend

- [x] 2.1 `catalog.ts` + `schemas/api.ts` : champ `description` ; propagation dans `fetchCatalog`
- [x] 2.2 `FlowPalette` : `title={description}` sur les items
- [x] 2.3 `BlockNode` : `title={description}` sur le label

## 3. Vérification

- [x] 3.1 Build frontend + pytest backend
- [x] 3.2 Smoke : tooltip sur la palette (survol) + description dans le payload `/api/catalog`
