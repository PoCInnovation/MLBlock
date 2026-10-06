# File Circuit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un seul circuit fichier : upload signé avec quota/TTL, contrat `accept` déclaré par les blocs, dropzone avec progression + aperçu + galerie dans l'inspecteur.

**Architecture:** Le backend médie (réserve le quota, signe l'URL, sniff au confirm) mais les octets vont en direct frontend → Supabase Storage. Le `accept` suit le chemin existant docstring → `ParamInfo` → `/api/catalog` → `toSegments`.

**Tech Stack:** FastAPI sync + SQLModel, Supabase Storage REST (service-role, pattern `_delete_file_from_storage`), React + shadcn (`Progress`), axios `onUploadProgress`, supabase-js existant pour l'auth seule.

**Spec:** `docs/superpowers/specs/2026-10-06-file-import-design.md` (§9 : upload inspecteur seul, pas de dropzone en config).

## Global Constraints

- Backend : `uv run` obligatoire (`uv run pytest mlblock/tests -q`, `uv run ruff check .`), jamais `pip`.
- Ruff `line-length = 120`, `E501` ignoré dans `backend/mlblock/blocks/`.
- Handlers FastAPI en `def` synchrone, `session: Session = Depends(get_session)`, `user = Depends(get_current_user)`.
- Blocs : fonctions pures, imports lourds (`pandas`, `PIL`) dans le corps, jamais au top-level.
- Frontend : `pnpm` obligatoire, `tsc --noEmit` + `eslint --max-warnings 0` + `vitest`, zéro style inline, shadcn only.
- Env : `FILE_QUOTA_BYTES` (défaut 500 Mo), `FILE_TTL_DAYS` (défaut 30). Passwords déjà gérés, hors scope.

## Review Focus

- Fichier déclaré 5 Mo mais 48 Mo réels au confirm → `413` + asset `expired` (test Task 2).
- `.exe` renommé en `.csv` → sniff magique refuse, `415` (test Task 2).
- 2 uploads concurrents dépassant le quota ensemble → la réservation en ligne bloque le 2e (test Task 2).
- URL expirée collée à la main dans un param `file` → badge « expiré » au lieu d'un 404 pandas (test Task 5).
- CSV de 500 Mo : l'aperçu ne lit que les premiers Ko, jamais le fichier entier (test Task 2).

---

## Files

- Create: `backend/mlblock/server/file_assets.py` — helpers purs (chemin storage, quota, sniff, URLs signées via REST service-role).
- Modify: `backend/mlblock/server/models.py` — table `FileAsset` (pattern `Pipeline`, FK `profiles.id`).
- Modify: `backend/mlblock/server/database.py` — importer `FileAsset` avant `create_all` (pattern lignes 30-34).
- Modify: `backend/mlblock/server/routes.py` — 5 endpoints sous `files_router` existant + cleanup TTL.
- Modify: `backend/mlblock/server/schemas.py` — `ParamInfo.accept: str | None = None`.
- Modify: `backend/mlblock/blocks/registry.py` — suffixe `(accept: ...)` dans `_extract_param_desc` (pattern `format:` ligne 152).
- Modify: 3 loaders `donnees-22C55E/` — docstrings `(format: ...)` + `try/except` FR.
- Modify: `frontend/src/types/catalog.ts` — `FileSeg` gagne `accept?: string`.
- Modify: `frontend/src/api/client.ts` — `toSegments` mappe `accept` (ligne 67) + 5 fonctions API files.
- Modify: `frontend/src/schemas/api.ts` — zod laisse passer `accept` (pattern `blockSchema` existant).
- Modify: `frontend/src/utils/samples.ts` — `kindOf(accept|mime)` + suppression `ACCEPT_BY_BLOCK`.
- Modify: `frontend/src/components/blocks/BlockSegments.tsx` — dropzone + `Progress` + galerie.
- Tests: `backend/mlblock/tests/test_file_assets.py` (nouveau), `frontend/src/utils/kindOf.test.ts` (nouveau), étendre `catalog-parse.test.ts`.

---

### Task 1: Table + helpers purs fichier

**Files:**
- Create: `backend/mlblock/server/file_assets.py`
- Modify: `backend/mlblock/server/models.py`
- Modify: `backend/mlblock/server/database.py`
- Test: `backend/mlblock/tests/test_file_assets.py`

**Interfaces:**
- Consumes: `SQLModel`, `get_session`, `SUPABASE_URL`/`SUPABASE_SECRET_KEY` (pattern `routes.py:67-69`).
- Produces: `FileAsset` (table `file_assets`) ; `build_storage_path(owner_id, asset_id, name) -> str` ; `quota_used(session, owner_id) -> int` ; `sniff_kind(head: bytes, filename: str) -> str` (`csv|image|text|model|audio|other`, magie stdlib seule : `\x89PNG`, `\xff\xd8`, `PK\x03\x04`, `RIFF`, virgule/point-virgule en tête) ; `sign_upload_url(bucket, path) -> str` (REST `POST /storage/v1/object/upload/sign/{bucket}/{path}`, service-role) ; `public_url(bucket, path) -> str`.

- [ ] **Step 1: Write the failing test**

```python
def test_sniff_kind_detects_csv_image_and_model():
    assert sniff_kind(b"a,b,c\n1,2,3\n", "data.csv") == "csv"
    assert sniff_kind(b"\x89PNG\r\n\x1a\n....", "img.png") == "image"
    assert sniff_kind(b"PK\x03\x04....", "w.pt") == "model"

def test_quota_used_sums_ready_and_pending(session):
    ...  # 2 assets ready (10 + 20) + 1 pending (5) + 1 expired (100) → 35
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest mlblock/tests/test_file_assets.py -q` (depuis `backend/`)
Expected: FAIL, `sniff_kind` / `FileAsset` undefined.

- [ ] **Step 3: Implement table `FileAsset` in `server/models.py` + helpers in `server/file_assets.py` + import in `database.py`**

Champs : `id` UUID pk · `owner_id` UUID indexé, FK `profiles.id` ondelete CASCADE · `name: str` · `storage_path: str` · `public_url: str = ""` · `mime: str = ""` · `size_bytes: int = 0` · `kind: str = "other"` · `status: str = "pending"` (indexé) · `created_at` / `expires_at: datetime`.

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest mlblock/tests/test_file_assets.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/server/file_assets.py backend/mlblock/server/models.py backend/mlblock/server/database.py backend/mlblock/tests/test_file_assets.py
git commit -m "feat(files): table FileAsset + helpers purs quota/sniff/urls"
```

---

### Task 2: Endpoints request-upload → confirm → liste/preview/delete

**Files:**
- Modify: `backend/mlblock/server/routes.py` (sous `files_router`, à côté de `/columns`)
- Test: `backend/mlblock/tests/test_file_assets.py`

**Interfaces:**
- Consumes: Task 1 (`FileAsset`, helpers) ; `get_current_user` ; `requests` mocké par `monkeypatch`.
- Produces: `POST /api/files/request-upload {name, size_bytes, mime, block_type?}` → `201 {id, signed_url, expires_at}` (`413` quota, `415` accept mismatch via catalogue) · `POST /api/files/{id}/confirm` → `200 {id, public_url, kind, preview}` (`413` taille réelle, `415` sniff) · `GET /api/files` → `[{id, name, size_bytes, kind, public_url, expires_at}]` (owner seul, `ready` seuls) · `GET /api/files/{id}/preview` → `{kind, rows?}` (CSV/texte : 5 premières lignes via GET service-role partiel, jamais le fichier entier) · `DELETE /api/files/{id}` → ligne + objet (pattern `_delete_file_from_storage`).

- [ ] **Step 1: Write the failing tests**

```python
def test_request_upload_refuses_over_quota(client, monkeypatch): ...  # 413 + message FR
def test_confirm_refuses_larger_than_declared(client, monkeypatch): ...  # 413 + status expired
def test_confirm_refuses_renamed_exe_as_csv(client, monkeypatch): ...  # 415
def test_preview_reads_only_head(client, monkeypatch): ...  # GET storage appelé, rows == 5
```

(SIG : suivre le fixture `client` existant de `test_server.py`, storage HTTP mocké via `monkeypatch` sur `requests`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_file_assets.py -q`
Expected: FAIL, routes 404.

- [ ] **Step 3: Implement the 5 endpoints in `routes.py` + cleanup TTL (`DELETE WHERE expires_at < now()` + objets, appelé au `confirm` et exposé en `cleanup_expired_files(session)`)**

Signatures : `def request_file_upload(body: RequestUpload, session: Session = Depends(get_session), user = Depends(get_current_user))`. TTL : `expires_at = now + timedelta(days=int(os.environ.get("FILE_TTL_DAYS", "30")))`. Quota : `quota_used(...) + body.size_bytes <= int(os.environ.get("FILE_QUOTA_BYTES", str(500*1024*1024)))`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests -q` (tout le backend, non-régression)
Expected: 0 failure.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/server/routes.py backend/mlblock/tests/test_file_assets.py
git commit -m "feat(files): endpoints upload signe, confirm sniff, galerie, TTL"
```

---

### Task 3: Contrat `accept` déclaré par les blocs

**Files:**
- Modify: `backend/mlblock/server/schemas.py` (`ParamInfo`)
- Modify: `backend/mlblock/blocks/registry.py` (`_extract_param_desc`)
- Modify: `donnees-22C55E/load_csv.py`, `load_text.py`, `load_image.py` (docstrings + `try/except` FR)
- Test: `backend/mlblock/tests/test_file_assets.py`

**Interfaces:**
- Consumes: suffixes existants (`format:`, ligne 152).
- Produces: `ParamInfo.accept` exposé en `params.<k>.accept` dans `GET /api/catalog` (via `model_dump`, routes.py:172, automatique).

- [ ] **Step 1: Write the failing test**

```python
def test_accept_suffix_parsed_from_docstring():
    desc, meta = _extract_param_desc("path: URL du CSV. (format: .csv)", "path")
    assert meta["accept"] == ".csv"

def test_catalog_exposes_accept_for_loaders():
    assert catalog.get("load_csv").params["path"].accept == ".csv"
    assert catalog.get("load_image").params["path"].accept in (".png|.jpg", ".png, .jpg")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest mlblock/tests/test_file_assets.py -q -k accept`
Expected: FAIL, `accept` unknown / `None`.

- [ ] **Step 3: Implement `accept: str | None = None` + branche `elif group.startswith("accept:")` + docstrings `(format: .csv)` / `(format: .csv|.txt)` / `(format: .png|.jpg)` + `try/except` FR autour de `read_csv`/`requests.get` (« fichier expiré ou supprimé — réimporte-le »)**

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests -q && uv run ruff check .`
Expected: PASS + clean.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/server/schemas.py backend/mlblock/blocks/registry.py backend/mlblock/blocks/donnees-22C55E/ backend/mlblock/tests/test_file_assets.py
git commit -m "feat(files): suffixe accept declare, catalogue l'expose, loaders durcis"
```

---

### Task 4: Frontend — `accept` du catalogue pilote le file input

**Files:**
- Modify: `frontend/src/types/catalog.ts`, `frontend/src/api/client.ts` (`toSegments:67`), `frontend/src/schemas/api.ts`, `frontend/src/utils/samples.ts`
- Test: `frontend/src/utils/kindOf.test.ts` (nouveau), étendre `frontend/src/api/catalog-parse.test.ts`

**Interfaces:**
- Consumes: `params.<k>.accept` du catalogue (Task 3).
- Produces: `FileSeg {t:'file', k, def, desc, accept?}` ; `kindOf(accept|mime: string) -> 'csv'|'image'|'text'|'model'|'audio'|'other'` ; suppression de `ACCEPT_BY_BLOCK` (remplacé par `seg.accept ?? DEFAULT_ACCEPT`).

- [ ] **Step 1: Write the failing tests**

```ts
it('mappe accept vers FileSeg', () => {
  expect(toSegFile({ type: 'file', default: '', accept: '.csv' })).toEqual({ t: 'file', k: 'path', def: '', accept: '.csv' })
})
it('kindOf classe par extension ou mime', () => {
  expect(kindOf('.pt|.pkl')).toBe('model')
  expect(kindOf('image/png')).toBe('image')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/utils/kindOf.test.ts src/api/catalog-parse.test.ts` (depuis `frontend/`)
Expected: FAIL.

- [ ] **Step 3: Implement `FileSeg.accept`, `toSegments`, zod passthrough, `kindOf`, suppression `ACCEPT_BY_BLOCK`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/utils/kindOf.test.ts src/api/catalog-parse.test.ts && pnpm exec tsc --noEmit && pnpm exec eslint src/ --max-warnings 0`
Expected: PASS + clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/catalog.ts frontend/src/api/client.ts frontend/src/schemas/api.ts frontend/src/utils/samples.ts frontend/src/utils/kindOf.test.ts frontend/src/api/catalog-parse.test.ts
git commit -m "feat(files): accept catalogue pilote le file input, kindOf"
```

---

### Task 5: Inspecteur — dropzone, progression, aperçu, galerie

**Files:**
- Modify: `frontend/src/components/blocks/BlockSegments.tsx`, `frontend/src/api/client.ts` (5 fns : `requestUpload`, `confirmUpload`, `listFiles`, `previewFile`, `deleteFile`)
- Test: `frontend/src/api/files.test.ts` (nouveau, `http` mocké)

**Interfaces:**
- Consumes: Task 2 (endpoints), Task 4 (`seg.accept`, `kindOf`).
- Produces: flux `request-upload` → `PUT` signed URL (axios `onUploadProgress` → `Progress` + Annuler via `AbortController`) → `confirm` → `onUpdate(blockId, k, public_url)`. Galerie : liste `ready`, un tap remplit, suppression manuelle, badge expiré (URL storage absente de la liste → « expiré, réimporte »). Erreurs FR actionnables, jamais de code HTTP brut.

- [ ] **Step 1: Write the failing tests**

```ts
it('requestUpload envoie nom/taille/mime/block_type et rend signed_url', ...)
it('une URL storage absente de la galerie est marquée expirée', ...)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/api/files.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement les 5 fonctions API + réécriture du rendu `s.t === 'file'` (dropzone drag & drop + tap, `Progress`, aperçu par `kind`, galerie, états uploading/error/uploaded conservés dans leur esprit)**

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm exec eslint src/ --max-warnings 0`
Expected: 0 failure + clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/blocks/BlockSegments.tsx frontend/src/api/client.ts frontend/src/api/files.test.ts
git commit -m "feat(files): dropzone progression apercu galerie dans l'inspecteur"
```

---

### Task 6: E2E navigateur — parcours démo sans friction (tâche de validation)

**Files:** aucun (vérification sur `vite dev` + backend local, comme les E2E précédentes).

- [ ] **Step 1: Ajouter `tabular_data_pipeline` au canvas, ouvrir l'inspecteur, uploader un CSV réel via la dropzone, constater progression + aperçu + remplissage du `path` de l'enfant `load_csv`**
- [ ] **Step 2: Rouvrir la galerie, constater le fichier listé, le réutiliser sur `load_image` (refusé : mismatch `accept`, message FR)**
- [ ] **Step 3: Supprimer le fichier de la galerie, constater le badge « expiré » sur le param**
- [ ] **Step 4: Commit vide interdit — si un bug sort, fix + test avant de clore**
