## 1. Backend — Add `/api/catalog` endpoint

- [x] 1.1 Add `GET /api/catalog` route in `routes.py` that returns nested categories→blocks with colors from `BLOCK_REGISTRY`
- [x] 1.2 Remove old endpoints: `GET /api/blocks`, `GET /api/blocks/categories`, `GET /api/blocks/{type}`
- [x] 1.3 Remove unused `Block` import from `routes.py`

## 2. Backend — Cleanup schemas

- [x] 2.1 Remove `Block` and `Category` Pydantic models from `schemas.py` if no longer referenced elsewhere

## 3. Frontend — Rewrite `fetchCatalog()`

- [x] 3.1 Replace `fetchCatalog()` body: single `GET /api/catalog` call, map response directly to `InternalCatalog`
- [x] 3.2 Inline param-to-Segment logic (extracted from `adaptParam`) — reuse it, keep it local
- [x] 3.3 Remove `fetchBlockSummariesPage`, `fetchAllBlockSummaries`, `fetchBlockCategories`, `fetchBlockDetail`, `adaptBlockDetail`, `adaptCategories`, `adaptParam`

## 4. Frontend — Remove hardcoded colors

- [x] 4.1 Delete `CATEGORY_META` and `FALLBACK_COLOR` from `api/client.ts`
- [x] 4.2 Remove `BlockSummary` and `BlockDetail` TypeScript types from `types/catalog.ts` if no longer referenced

## 5. Deploy

- [ ] 5.1 Commit and push both backend + frontend changes
- [ ] 5.2 Deploy backend on Render (auto)
- [ ] 5.3 Deploy frontend on Render (auto, rebuild static site)
- [ ] 5.4 Verify frontend loads catalog without errors
