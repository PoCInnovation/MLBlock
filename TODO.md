# Backend Integration TODO

## Placeholder API Routes

### GET /api/blocks/TODO (block catalog)

Fetches the full catalog manifest when the editor opens.

Response shape: `{ version: string, categories: Category[], dtypes: unknown, blocks: BlockDefMap }`

- `categories`: list of `{ id, name, color }`
- `dtypes`: shape TBD with backend
- `blocks`: map of block type to `{ cat: string, segs: Segment[] }`, each segment being `{ t: 'text', v }`, `{ t: 'num', k, def, w? }`, or `{ t: 'sel', k, def, opts[] }`

When the backend is ready: swap the path in `src/api/client.ts`, check the response against `CatalogManifest` in `src/types/catalog.ts`, and fix the `dtypes` typing.

### POST /api/pipeline/TODO (run pipeline)

Sends the current graph when the user hits "Lancer".

Request body: `{ nodes: GraphNode[], edges: GraphEdge[] }`

- `nodes`: `{ id, type, fields }`, mapped from the current `Block[]` model
- `edges`: empty for now, no real graph model yet

Response is untyped (`unknown`) since we don't know its shape. Result gets stored and logged as-is.

When the backend is ready: swap the path, type the return properly in `src/api/client.ts` and `src/store/useAppStore.ts` (`result` field), and build real result display in `ConsolePanel.tsx`.

---

## Out of scope for now

Auth and login routes are coming later. `src/api/client.ts` stays a thin module for now, no token handling, no headers, nothing auth-related added yet.

---

## Other notes

- No retry on catalog load failure yet. The "Éditeur non disponible" modal only has a back button, add retry once we know what the UX should be.
- Pipeline failures just log to console and drop a generic message in the console panel, fine until we see the real error shape.
- Graph model is a flat node list, no edges. Update `GraphPayload` in `src/types/catalog.ts` once the real structure exists.
