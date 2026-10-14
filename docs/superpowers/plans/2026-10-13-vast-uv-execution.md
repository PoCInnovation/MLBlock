# Vast UV Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lancer les jobs GPU sur une image légère avec `uv`, en récupérant `main.py` au boot au lieu de l'embarquer dans `onstart` (limite Vast 16 Ko).

**Architecture:** `execute_pipeline` choisit l'image via `needs_cuda()` (source vérité = `engine` du Catalog), construit un bootstrap `onstart` < 1 Ko qui `curl` le code depuis une nouvelle route `GET /api/jobs/{id}/code` (auth `verify_gpu_key`), puis `uv pip install` + `python3 main.py`. Secrets inline dans le bootstrap comme aujourd'hui (même domaine de confiance que la console Vast).

**Tech Stack:** FastAPI sync + SQLModel, `uv`, Vast.ai REST (`PUT /asks/{id}`), pytest + StaticPool in-memory.

**Spec:** Décisions chat du 2026-10-13 (pas de design doc) : double image (slim par défaut, CUDA si `engine == pytorch`), livraison via route backend (pas Supabase Storage), `gpu_name RTX 3090` et callbacks inchangés.

## Global Constraints

- Backend `uv` mandatory (`uv sync`, `uv run`), jamais `pip` direct ni venv manuel.
- Ruff `line-length = 120`, `uv run ruff check .` + `uv run ruff format .` avant commit.
- Python `>=3.10`, pas d'import lourd (`torch`, `pandas`, `sklearn`) au top-level.
- Routes sync `def` + `Depends(get_session)` / `Depends(get_current_user)` ; callbacks GPU via `Depends(verify_gpu_key)`.
- Vocabulaire domaine : Block, Catalog, Pipeline, Job (jamais Run/Task/Workflow).
- Tests : `uv run pytest mlblock/tests -q` depuis `backend/` ; suite in-memory, skip propre sans Supabase.

## Review Focus

- Backend Render endormi au `curl` du boot : le retry (`--retry 8 --retry-all-errors --retry-delay 10`) couvre ~80 s+ ; vérifier qu'un réveil > 90 s donne erreur propre, pas instance orpheline (le filet `schedule_orphan_cleanup` reste en place).
- `CONTAINER_API_KEY` absent (Vast ne l'injecte pas) : repli `${CONTAINER_API_KEY:-$GPU_API_KEY}` attendu ; tester le cas clé globale seule.
- Bloc inconnu du Catalog → `engine` générique → image slim → `import torch` lève `ImportError` au runtime ; message d'erreur du job doit rester lisible (callback error existant).
- Hôte Vast sans accès `ghcr.io` : le pull échoue, l'instance ne passe jamais `running` ; pas de test auto, surveiller au premier vrai rent.
- Caractère `'` dans `GPU_API_KEY`/`BACKEND_URL` casserait le wrapping `k='v'` ; clés actuelles alphanum + aucun test auto — garder la convention existante.
- Les 2 lignes `output` du bootstrap (`block: bootstrap`) atterrissent dans `job_outputs` donc panneau résultats ; préfixe filtrable côté frontend si besoin, hors scope.
- Seuil 1 Go volontairement absurde : Realtime/Postgres peuvent râler avant sur une courbe géante non-image ; le marqueur explicite reste le filet, pas de coupe silencieuse.

---

### Task 1: needs_cuda() dans core/stages.py

**Files:**
- Modify: `backend/mlblock/core/stages.py` (append, après `engine_of_block`)
- Test: `backend/mlblock/tests/test_stages.py`

**Interfaces:**
- Consumes: `engine_of_block(block_name, category=None)` (existant, `stages.py:401`), `resolve_alias` via lui.
- Produces: `needs_cuda(nodes: list[Any]) -> bool` — accepte dicts (`{"type":..., "children":[...]}`) ou modèles (attrs `.type`/`.children`), récursion dans `children`, `True` si un type résout `engine == "pytorch"`.

- [ ] **Step 1: Write the failing test**

```python
def test_needs_cuda_true_for_pytorch_engine(monkeypatch):
    from mlblock.core import stages
    monkeypatch.setitem(stages.ENGINE_OF_BLOCK_OVERRIDES, "fake_torch_block", "pytorch")
    assert stages.needs_cuda([{"id": "n1", "type": "fake_torch_block", "children": []}]) is True


def test_needs_cuda_false_and_recursive(monkeypatch):
    from mlblock.core import stages
    assert stages.needs_cuda([]) is False
    assert stages.needs_cuda([{"id": "n1", "type": "bloc_inconnu_xyz", "children": []}]) is False
    assert stages.needs_cuda(
        [{"id": "p", "type": "bloc_inconnu_xyz", "children": [{"id": "c", "type": "bloc_inconnu_xyz"}]}]
    ) is False
    monkeypatch.setitem(stages.ENGINE_OF_BLOCK_OVERRIDES, "fake_nested_torch", "pytorch")
    assert stages.needs_cuda(
        [{"id": "p", "type": "bloc_inconnu_xyz", "children": [{"id": "c", "type": "fake_nested_torch"}]}]
    ) is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest mlblock/tests/test_stages.py -q -k needs_cuda` depuis `backend/`
Expected: FAIL with "needs_cuda not defined" (ou `AttributeError`).

- [ ] **Step 3: Implement `needs_cuda(nodes: list[Any]) -> bool` in `backend/mlblock/core/stages.py`**

Parcourt types + enfants récursivement, compare `engine_of_block(t) == "pytorch"`. Pas d'import top-level nouveau (lazily si besoin).

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest mlblock/tests/test_stages.py -q` depuis `backend/`
Expected: PASS (tout le fichier).

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/core/stages.py backend/mlblock/tests/test_stages.py
git commit -m "feat: add needs_cuda engine check for image selection"
```

---

### Task 2: Builders image/bootstrap dans execution.py

**Files:**
- Modify: `backend/mlblock/execution.py` (constantes + builders, réutilisés par `VastBackend.launch` et `routes.execute_pipeline`)
- Test: `backend/mlblock/tests/test_execution.py` (créer)

**Interfaces:**
- Consumes: `needs_cuda` (Task 1) — uniquement via paramètre `cuda: bool`, pas d'import direct (les builders restent purs).
- Produces:
  - `IMAGE_SLIM: str = "ghcr.io/astral-sh/uv:python3.12-trixie-slim"`
  - `IMAGE_CUDA: str = "vastai/pytorch:2.6.0-cuda-12.6.3-py312"`
  - `REQUIREMENTS_SLIM: str = "scikit-learn gymnasium pandas requests xgboost mlflow"`
  - `REQUIREMENTS_CUDA: str = "scikit-learn gymnasium torchvision pandas requests xgboost mlflow"`
  - `image_for(cuda: bool) -> str`, `disk_for(cuda: bool) -> int` (`20` slim, `50` cuda), `requirements_for(cuda: bool) -> str`
  - `build_bootstrap(*, backend_url: str, job_id: str, gpu_key: str, timeout: str, cuda: bool) -> str` — template exact ci-dessous, quoting `k='v'` comme aujourd'hui.

Template (lignes jointes par `\n`, ~1 Ko, pas de `{}` solitaires — concaténation simple).
Le bootstrap signale sa progression : 1 `status` (`running`, feedback UI avant le code généré) + 2 `output` (`bootstrap`, visibles via Realtime comme les autres sorties) :

```bash
export BACKEND_URL='<backend_url>' GPU_API_KEY='<gpu_key>' JOB_ID='<job_id>' BACKEND_TIMEOUT='<timeout>'
KEY="${CONTAINER_API_KEY:-$GPU_API_KEY}"
command -v curl >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq curl; }
post() { curl -sS -m 20 -X POST -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' -d "$2" "$BACKEND_URL/api/jobs/$JOB_ID/$1" || true; }
post status '{"block":"bootstrap","status":"running"}'
command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv pip install --system -q <reqs> || pip install -q --disable-pip-version-check <reqs>
post output '{"block":"bootstrap","output":"Environnement installé"}'
curl -sSf --retry 8 --retry-all-errors --retry-delay 10 -H "Authorization: Bearer $KEY" "$BACKEND_URL/api/jobs/$JOB_ID/code" -o main.py || { post error '{"block":"bootstrap","error":"Code non récupéré"}'; exit 1; }
post output '{"block":"bootstrap","output":"Code récupéré"}'
python3 main.py
```

- [ ] **Step 1: Write the failing test**

```python
def test_image_and_disk_selection():
    from mlblock import execution as ex
    assert ex.image_for(False) == ex.IMAGE_SLIM
    assert ex.image_for(True) == ex.IMAGE_CUDA
    assert ex.disk_for(False) == 20
    assert ex.disk_for(True) == 50


def test_build_bootstrap_slim_contains_code_endpoint_and_uv():
    from mlblock import execution as ex
    s = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=False)
    assert "/api/jobs/$JOB_ID/code" in s
    assert "uv pip install --system" in s
    assert "torchvision" not in s
    assert "post status '{\"block\":\"bootstrap\",\"status\":\"running\"}'" in s
    assert s.count("post output") == 2
    assert "exit 1" in s
    assert "command -v curl" in s and "apt-get install" in s
    assert len(s) < 4048
```
(python:slim embarque `uv` mais pas `curl` — filet `apt-get`, cf. revue finale.)


def test_build_bootstrap_cuda_keeps_torchvision():
    from mlblock import execution as ex
    s = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=True)
    assert "torchvision" in s
    assert "${CONTAINER_API_KEY:-$GPU_API_KEY}" in s
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest mlblock/tests/test_execution.py -q` depuis `backend/`
Expected: FAIL with import/attribute errors (fonctions absentes).

- [ ] **Step 3: Implement constants + `image_for` + `disk_for` + `requirements_for` + `build_bootstrap` in `backend/mlblock/execution.py`**

Réutiliser dans `VastBackend.launch` (remplace le bloc `deps`/`env_str`/`onstart` actuel, `execution.py:67-84`) : `launch(self, code, job_id, *, cuda: bool = False)` ; ajouter `cuda: bool = False` au `Protocol ExecutionBackend` et à `LocalBackend.launch` (ignoré). Vérifier qu'aucun autre appelant `.launch(` ne casse (`test_runtime_codegen.py:112` appelle sans `cuda` → défaut OK).

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest mlblock/tests/test_execution.py mlblock/tests/test_runtime_codegen.py -q` depuis `backend/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/execution.py backend/mlblock/tests/test_execution.py
git commit -m "feat: add uv image/bootstrap builders for vast execution"
```

---

### Task 3: Route code + câblage execute_pipeline

**Files:**
- Modify: `backend/mlblock/server/routes.py` (nouvelle route `GET /api/jobs/{job_id}/code` près de `get_job_instance:951` ; branche GPU de `execute_pipeline:813-855` utilise `needs_cuda` + `build_bootstrap` + `image_for`/`disk_for`)
- Modify: `backend/mlblock/tests/test_server.py` (tests route + asserts bootstrap/image)
- Modify: `docs/routes.md` (contrat de la nouvelle route)

**Interfaces:**
- Consumes: `needs_cuda` (Task 1), `build_bootstrap`/`image_for`/`disk_for` (Task 2), `verify_gpu_key` (`gpu_auth.py:10`), `Job`/`PipelineTable`.
- Produces: `GET /api/jobs/{job_id}/code -> PlainTextResponse` (code stocké `row.code` ; 404 si job/pipeline/code absent). `execute_pipeline` garde son flux (mock/local/dummy/start/orphan) et son point de patch `mlblock.server.routes.VastAI` (le test `test_execute_gpu_rent_failure_returns_full_job` reste vert sans modification).

- [ ] **Step 1: Write the failing tests**

```python
def test_job_code_endpoint_gpu_auth(client: TestClient, monkeypatch):
    from mlblock.server.gpu_auth import GPU_API_KEY as GLOBAL_KEY
    from mlblock.server.gpu_auth import verify_gpu_key
    monkeypatch.setenv("BACKEND_TIMEOUT", "2")  # subprocess mock : callbacks échouent vite
    app.dependency_overrides.pop(verify_gpu_key, None)
    created = client.post("/api/pipelines", json={"name": "code-route", "nodes": [], "edges": []}).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    bad = client.get(f"/api/jobs/{job['id']}/code", headers={"Authorization": "Bearer autre-cle"})
    assert bad.status_code == 403
    ok = client.get(f"/api/jobs/{job['id']}/code", headers={"Authorization": f"Bearer {GLOBAL_KEY}"})
    assert ok.status_code == 200
    assert "Generated by MLBlock" in ok.text


def test_execute_gpu_uses_slim_image_and_bootstrap(client: TestClient, monkeypatch):
    seen = {}
    class FakeVast:
        def __init__(self, api_key): pass
        def launch_instance(self, **kw):
            seen.update(kw)
            return {"id": "mock-instance-id", "api_key": ""}
        def start_instance(self, *a, **kw): pass
        def destroy_instance(self, *a, **kw): pass
    monkeypatch.setenv("MLBLOCK_RUN_MODE", "gpu")
    monkeypatch.setenv("VAST_API_KEY", "real-key-for-test")
    monkeypatch.setenv("MLBLOCK_GPU_TIMEOUT", "1")
    monkeypatch.setenv("BACKEND_TIMEOUT", "2")
    monkeypatch.setattr("mlblock.server.routes.VastAI", FakeVast)
    created = client.post("/api/pipelines", json={"name": "img-slim", "nodes": [], "edges": []}).json()
    resp = client.post(f"/api/pipelines/{created['id']}/execute")
    assert resp.status_code == 200
    assert seen["image"] == "ghcr.io/astral-sh/uv:python3.12-trixie-slim"
    assert "/api/jobs/$JOB_ID/code" in seen["onstart"]
    assert "MLBLOCK_EOF" not in seen["onstart"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_server.py -q -k "job_code_endpoint or slim_image_and_bootstrap"` depuis `backend/`
Expected: FAIL (route 404, `image` = `pytorch/pytorch:latest`).

- [ ] **Step 3: Implement route + wiring in `backend/mlblock/server/routes.py`**

Route après `get_job_instance` : lit `Job`, puis `PipelineTable`, retourne `PlainTextResponse(row.code or "")`, 404 si job/pipeline/code manquant. Branche GPU : `cuda = needs_cuda(nodes)` (`nodes` déjà parsés, modèles avec `.type`/`.children` supportés par Task 1), `onstart = build_bootstrap(...)`, `image=image_for(cuda)`, `disk=disk_for(cuda)`. Le reste (dummy/error/start/orphan) inchangé.

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests/test_server.py -q` puis `uv run ruff check . && uv run ruff format --check .` depuis `backend/`
Expected: PASS, ruff propre (corriger avec `ruff format` si besoin).

- [ ] **Step 5: Document + commit**

Ajouter la route à `docs/routes.md` (méthode, auth Bearer instance/globale, réponse `text/plain`). Puis :

```bash
git add backend/mlblock/server/routes.py backend/mlblock/tests/test_server.py docs/routes.md
git commit -m "feat: fetch job code at boot on slim uv image"
```

---

### Task 4: Fin du 20K — gzip partout sauf image vers Storage

**Files:**
- Modify: `backend/mlblock/core/generator.py` (enveloppe gzip dans `notify_output` généré, upload artifacts pour bytes, miroir `_serialize_value` + suppression `TRUNCATE_AT`)
- Modify: `backend/mlblock/server/routes.py` (nouvelle route `POST /api/jobs/{job_id}/artifact`, suppression coupe 20k `push_job_output:1003`)
- Modify: `backend/mlblock/server/schemas.py` (réponse artifact `{url}`)
- Modify: `backend/mlblock/tests/test_server.py` (nouveaux tests + mise à jour `test_serialize_output_typed:456`)
- Modify: `frontend/src/components/flow/JournalPanel.tsx` (décode `gzip` async + rend image URL, `parseOutput:18` reste sync pour le reste)
- Modify: `backend/mlblock/server/routes.py` (nouvelle route `POST /api/jobs/{job_id}/artifact`, suppression coupe 20k `push_job_output:1003`)
- Modify: `backend/mlblock/server/schemas.py` (réponse artifact `{url}`)
- Modify: `frontend/src/components/flow/JournalPanel.tsx` (décode `gzip` async + rend image URL, `parseOutput:18` reste sync pour le reste)
- Modify: `frontend/src/hooks/useJobRunner.ts` (suppression coupe Realtime `:69`)
- Modify: `docs/routes.md` (route artifact)

**Interfaces:**
- Consumes: `verify_gpu_key`, `JobOutput`, pattern upload Storage `requests` (`execution.py:108-123`), bucket `job-artifacts` (création manuelle Supabase, notée ci-dessous).
- Produces:
  - Enveloppe : `{"type":"gzip","data":"<b64 du gzip du JSON>"}` ; texte/courbes/métriques compressés, jamais coupés en silence.
  - Garde-fou abusif : si enveloppe > 1 Go → sortie marqueur explicite `{"type":"text","text":"...[sortie abusive, ignorée]"}` (jamais de coupe mid-string ; seuil volontairement absurde, pas une limite métier).
  - `POST /api/jobs/{job_id}/artifact` (multipart `file` + `mime`) → upload `job-artifacts/{job_id}/{uuid}` → insert `JobOutput` `{type: image, url}` → `JobArtifactResponse{url}` (nouveau schéma `schemas.py`). Bytes générés (plots PNG) passent par là, plus de b64 en DB. Aucun producteur vidéo aujourd'hui : scope images uniquement.
  - `decodeOutput(raw): Promise<TypedOutput>` async (native `DecompressionStream`, repli marqueur si indisponible) ; `OutputRenderer` charge via état local ; `<img src=url>` pour image URL (b64 legacy gardé en lecture).

- [ ] **Step 1: Write the failing tests**

```python
def test_generated_code_gzip_envelope_and_no_truncation():
    from mlblock.core.generator import generate_code
    from mlblock.server.schemas import PipelineNode
    code = generate_code([PipelineNode(id="n1", type="train_model", params={"epochs": "5"})], [])
    assert "gzip.compress" in code
    assert "[:20000]" not in code
```

```python
def test_artifact_route_auth_and_storage(client: TestClient, monkeypatch):
    from mlblock.server.gpu_auth import verify_gpu_key
    app.dependency_overrides.pop(verify_gpu_key, None)
    created = client.post("/api/pipelines", json={"name": "art", "nodes": [], "edges": []}).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    monkeypatch.setattr("mlblock.server.routes.requests.put", lambda *a, **kw: type("R", (), {"raise_for_status": lambda s: None})())
    bad = client.post(f"/api/jobs/{job['id']}/artifact", headers={"Authorization": "Bearer x"})
    assert bad.status_code == 403


def test_artifact_route_success_stores_output_row(client: TestClient, monkeypatch):
    """Chemin 200 (revue finale) : upload mocké + ligne `job_outputs` avec URL."""
    import json as _json

    from mlblock.server.gpu_auth import GPU_API_KEY as GLOBAL_KEY
    from mlblock.server.gpu_auth import verify_gpu_key

    monkeypatch.setenv("BACKEND_TIMEOUT", "2")
    monkeypatch.setenv("SUPABASE_URL", "https://xyzcompany.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "secret-test")
    monkeypatch.setattr(
        "mlblock.server.routes.requests.put",
        lambda *a, **kw: type("R", (), {"raise_for_status": lambda s: None})(),
    )
    app.dependency_overrides.pop(verify_gpu_key, None)
    created = client.post("/api/pipelines", json={"name": "art-ok", "nodes": [], "edges": []}).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    resp = client.post(
        f"/api/jobs/{job['id']}/artifact",
        files={"file": ("output.png", b"\x89PNG\r\n", "image/png")},
        data={"mime": "image/png", "block": "plot_block"},
        headers={"Authorization": f"Bearer {GLOBAL_KEY}"},
    )
    assert resp.status_code == 200
    url = resp.json()["url"]
    assert url.startswith("https://xyzcompany.supabase.co/storage/v1/object/public/job-artifacts/")
    rows = client.get(f"/api/jobs/{job['id']}/outputs").json()
    assert _json.loads(rows[-1]["output"]) == {"type": "image", "mime": "image/png", "url": url}


def test_large_output_roundtrips_byte_identical(client: TestClient, monkeypatch):
    """Sans troncature (revue finale) : enveloppe ~100 Ko relue à l'identique."""
    from mlblock.server.gpu_auth import GPU_API_KEY as GLOBAL_KEY
    from mlblock.server.gpu_auth import verify_gpu_key

    monkeypatch.setenv("BACKEND_TIMEOUT", "2")
    app.dependency_overrides.pop(verify_gpu_key, None)
    created = client.post("/api/pipelines", json={"name": "big-out", "nodes": [], "edges": []}).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    big = " Courbe0123456789" * 6250  # ~100 Ko
    assert len(big) > 100000
    push = client.post(
        f"/api/jobs/{job['id']}/output",
        json={"block": "evaluate", "output": big},
        headers={"Authorization": f"Bearer {GLOBAL_KEY}"},
    )
    assert push.status_code == 200
    rows = client.get(f"/api/jobs/{job['id']}/outputs").json()
    assert rows[-1]["output"] == big
```
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_server.py -q -k "gzip_envelope or artifact_route"` depuis `backend/`
Expected: FAIL (pas de gzip, pas de route → 404).

- [ ] **Step 3: Implement enveloppe + route artifact**

Générateur : `notify_output` sérialise, `gzip.compress` + b64 sauf bytes (→ `POST artifact`, échec = marqueur explicite, le run continue). Miroir : `_serialize_value` (`generator.py:12`) suit le même contrat (enveloppe gzip, bytes → marqueur `artifact-pending` documenté) ; supprimer `TRUNCATE_AT` (`:6`) et le champ IR `truncateAt` (`:393`, zéro consommateur frontend). Mettre à jour `test_serialize_output_typed` (`test_server.py:456`, `exec` du code généré) vers les nouvelles formes (enveloppe `gzip`, bytes → upload/marqueur, plus de b64 inline). Schémas : ajouter `JobArtifactResponse(BaseModel)` avec `url: str`. Routes : `POST artifact` (multipart, `verify_gpu_key`), upload Storage via `SUPABASE_URL`/`SUPABASE_SECRET_KEY`, 404 job absent, 502 si Storage sans clés (message explicite, pas de b64 de repli). Supprimer les 3 coupes 20k (générateur, `push_job_output`, Realtime frontend).

- [ ] **Step 4: Frontend decode + tests**

`parseOutput` reste sync pour les types directs ; nouveau `decodeOutput(raw: string): Promise<TypedOutput>` : cas `gzip` → décompresse (`DecompressionStream('gzip')`, repli marqueur si indisponible) puis ré-entrée `parseOutput`. `OutputRenderer` appelle `decodeOutput` dans `useEffect` + état local (spinner pendant le décodage). Image avec `url` → `<img src=url>`, b64 legacy gardé en lecture. Test Vitest : `await decodeOutput(enveloppe)` (bytes gzip produits par `node:zlib`) → `{type:'curve',...}`.

Run: `pnpm exec tsc --noEmit` + `pnpm test` depuis `frontend/`, `uv run pytest mlblock/tests -q` depuis `backend/` (inclut `test_runtime_codegen` end-to-end : la branche upload bytes doit dégrader en marqueur sans planter le run)
Expected: PASS partout.

- [ ] **Step 5: Document + commit**

`docs/routes.md` (route artifact + fin du 20k). Bucket `job-artifacts` à créer à la main dans Supabase (noter dans le message de commit ou la doc). Puis :

```bash
git add backend/mlblock/core/generator.py backend/mlblock/server/routes.py backend/mlblock/server/schemas.py backend/mlblock/tests/test_server.py frontend/src/components/flow/JournalPanel.tsx frontend/src/hooks/useJobRunner.ts docs/routes.md
git commit -m "feat: gzip outputs, artifacts to storage, drop 20k truncation"
```

---

## Self-Review

1. **Spec coverage:** double image → Tasks 1+2+3 ; sortie limite 16 Ko → bootstrap < 1 Ko + `_encode_onstart` inchangé (Task 2, assert `< 4048`) ; route backend (pas Storage) → Task 3 ; `RTX 3090`/callbacks/orphan inchangés → Task 3 (flux conservé) ; fin du 20k + gzip + artifacts image → Task 4 (3 coupes supprimées, enveloppe `gzip`, route artifact + `JobArtifactResponse`, `decodeOutput` async `JournalPanel`).
2. **Step scan:** chaque test porte des asserts exacts ; chaque step code donne signature + fichier ; vérifications = commande + sortie attendue ; pas de corps de fonction recopié sauf le template bootstrap (contenu spécifié, pas déductible).
3. **Type consistency:** `needs_cuda(list[Any]) -> bool`, `image_for(bool) -> str`, `disk_for(bool) -> int`, `build_bootstrap(*, backend_url: str, job_id: str, gpu_key: str, timeout: str, cuda: bool) -> str` — noms repris à l'identique dans les 3 tâches ; `launch(..., *, cuda: bool = False)` compatible avec l'appel existant `test_runtime_codegen.py:112`.
4. **Review Focus:** chaque ligne a son test sauf pull `ghcr.io` impossible en CI (noté : surveiller au premier rent réel) et caractères spéciaux dans clés (convention existante conservée).
5. **Proportion:** plan ≈ contenu des 3 diffs, pas de transcription : corps de `needs_cuda`/route laissés à l'implémenteur.
