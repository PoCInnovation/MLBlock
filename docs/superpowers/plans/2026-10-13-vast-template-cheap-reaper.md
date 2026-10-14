# Template CUDA + cheap non-CUDA + reaper orphelines — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Louer les jobs CUDA sur le template Vast de l'équipe et les jobs non-CUDA sur l'offre vérifiée la moins chère, puis réconcilier les instances orphelines par un reaper hors process web.

**Architecture:** Le chemin CUDA passe `template_hash_id` au `PUT /asks/{id}` existant (précédence doc : scalaires requête gagnent, `env` fusionné, image héritée du template) avec `label=mlblock-{job_id}` ; le chemin slim garde l'image `ghcr` + recherche sans filtre GPU (moins cher vérifié). Le reaper `python -m mlblock.reap` croise `GET /api/v1/instances` (filtre `actual_status`, colonnes `id/label/actual_status`) avec la table `jobs` (registre existant : `vast_instance_id`, `status`) et détruit selon 4 règles.

**Tech Stack:** Python 3.11, `requests` (pas de SDK Vast), SQLModel, pytest + httpx TestClient, Render Cron (ops, hors plan).

**Spec:** Décisions utilisateur 2026-10-13 (fil de session) + docs Vast `create-instance` (`template_hash_id`, précédence, `label`), `show-instances` (`/api/v1/instances`, pagination 25, filtres), `hello-world` (poll trap `exited/unknown/offline`, `new_contract`, `CONTAINER_API_KEY`).

## Global Constraints

- Rester sur la branche `dev/chedli`, ne jamais push vers `main` (commit local uniquement).
- Backend : `uv run pytest mlblock/tests -q` depuis `backend/` ; routes FastAPI en `def` sync ; `ValueError` → `HTTPException(400)` ; chaînes utilisateur en français.
- Mock préservé : clé `mock` → `mock-instance-id` / `local-instance-id`, aucun HTTP réel en tests.
- Bootstrap inchangé : le template embarque déjà `uv`, la ligne `command -v uv || ...` devient no-op — ne pas la retirer (filet si le template change).
- `onstart` reste < 4048 caractères (`_encode_onstart` existant).

## Review Focus

- Template privé ou hash révoqué → `PUT /asks` 4xx : le job doit passer en `error` français explicite, pas `dummy-instance-id` silencieux. (Test en Task 1.)
- Recherche cheap sans filtre GPU → 0 offre ou offre exotique : erreur française immédiate comme le chemin CUDA. (Test en Task 1.)
- `label` doit être unique par job (`mlblock-{job_id}`) : deux jobs ne partagent jamais un label. (Test en Task 1.)
- `show-instances` paginé (25 max) : le reaper suit `next_token` jusqu'au bout. (Test en Task 2.)
- Reaper qui tue un job légitime en cours de boot (callback en vol) : période de grâce de 600 s après `created_at`. (Test en Task 3.)

---

### Task 1: Lancement template CUDA + offre cheap + label

**Files:**
- Modify: `backend/mlblock/core/vast.py:21-77` (`search_offers`, `launch_instance`)
- Modify: `backend/mlblock/execution.py:22-36` (politique image/disk/gpu/template/label)
- Modify: `backend/mlblock/server/routes.py:818-853` (`execute_pipeline`, branche non-mock)
- Test: `backend/mlblock/tests/test_execution.py`, `backend/mlblock/tests/test_server.py`

**Interfaces:**
- Consumes: `needs_cuda(nodes: list) -> bool` (`core/stages.py`, existant).
- Produces: `template_for(cuda: bool) -> str | None` ; `gpu_for(cuda: bool) -> str | None` (`"RTX 3090"` si cuda, `None` sinon) ; `label_for(job_id: UUID | str) -> str` (`f"mlblock-{job_id}"`) ; `VastAI.search_offers(gpu_name: str | None, ...)` (`None` = omet le filtre `gpu_name`, garde `verified/rentable/rented/num_gpus/order dph_total/limit`) ; `VastAI.launch_instance(..., template_hash_id: str | None = None, label: str | None = None) -> dict` (ajoute les clés au payload PUT uniquement si non-`None` ; `image` omise si `template_hash_id` fourni et `image is None`).
- Constante : `TEMPLATE_CUDA_HASH = os.environ.get("VAST_TEMPLATE_CUDA", "b12fc2b5f6c711d715a5e4714b246818")` dans `execution.py` (propriétaire unique de la politique GPU).

- [ ] **Step 1: Write the failing tests** in `backend/mlblock/tests/test_execution.py` :

```python
def test_gpu_for_cuda_returns_rtx3090_and_template():
    assert gpu_for(True) == "RTX 3090"
    assert template_for(True) == TEMPLATE_CUDA_HASH

def test_gpu_for_slim_returns_none_and_no_template():
    assert gpu_for(False) is None
    assert template_for(False) is None

def test_label_for_is_unique_per_job():
    assert label_for("aaa") == "mlblock-aaa"
    assert label_for("aaa") != label_for("bbb")

def test_search_offers_without_gpu_name_omits_filter(monkeypatch):
    seen = {}
    monkeypatch.setattr("mlblock.core.vast.requests.post", lambda url, **kw: seen.update(json=kw["json"]) or _OkOffers([]))
    VastAI(api_key="real-key").search_offers(None)
    assert "gpu_name" not in seen["json"]

def test_launch_instance_sends_template_and_label(monkeypatch):
    seen = {}
    monkeypatch.setattr("mlblock.core.vast.VastAI.search_offers", lambda s, g, n=1, limit=5: [{"id": 7}])
    monkeypatch.setattr("requests.put", lambda url, **kw: seen.update(json=kw["json"]) or _OkContract(42))
    VastAI(api_key="real-key").launch_instance(None, 1, None, 20, template_hash_id="h", label="mlblock-j")
    assert seen["json"]["template_hash_id"] == "h"
    assert seen["json"]["label"] == "mlblock-j"
    assert "image" not in seen["json"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_execution.py -q -k "gpu_for or label_for or without_gpu_name or sends_template"` depuis `backend/`
Expected: FAIL (`gpu_for`/`template_for`/`label_for` indéfinis, clés payload absentes).

- [ ] **Step 3: Implement `template_for`, `gpu_for`, `label_for`, `TEMPLATE_CUDA_HASH` in `backend/mlblock/execution.py`, `gpu_name: str | None` + `template_hash_id`/`label` in `backend/mlblock/core/vast.py`, et la branche non-mock de `execute_pipeline` (`routes.py:818-853`) : cuda → `gpu_name="RTX 3090"` + template + image héritée ; sinon → `gpu_name=None` + `image_for(False)` + pas de template ; `label=label_for(job.id)` dans les deux cas**

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests/test_execution.py mlblock/tests/test_server.py -q` depuis `backend/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/core/vast.py backend/mlblock/execution.py backend/mlblock/server/routes.py backend/mlblock/tests/test_execution.py backend/mlblock/tests/test_server.py
git commit -m "feat: launch CUDA jobs on team template, cheap offer otherwise, label per job"
```

### Task 2: Lecture d'inventaire Vast (`show-instances`)

**Files:**
- Modify: `backend/mlblock/core/vast.py:93-119` (à côté de `start_instance`/`destroy_instance`)
- Test: `backend/mlblock/tests/test_execution.py`

**Interfaces:**
- Consumes: Task 1 (`VastAI(api_key)`).
- Produces: `VastAI.list_instances(status: str | None = None) -> list[dict]` — `GET {base}/../v1/instances` (base v0 → v1 par remplacement du segment de version), params `select_cols=["id","label","actual_status"]`, `select_filters={"actual_status":{"eq":status}}` si status donné, suit `next_token` jusqu'à épuisement, retourne la concaténation des pages ; clé `mock` → `[]` sans HTTP ; exception réseau → `[]` (log `print` comme les autres méthodes, jamais d'exception vers l'appelant).

- [ ] **Step 1: Write the failing tests** :

```python
def test_list_instances_sends_v1_select_and_filter(monkeypatch):
    seen = {}
    monkeypatch.setattr("mlblock.core.vast.requests.get", lambda url, **kw: seen.update(url=url, params=kw["params"]) or _OkInstances([{"id": 1, "label": "mlblock-a", "actual_status": "running"}], None))
    out = VastAI(api_key="real-key").list_instances("running")
    assert "/api/v1/instances" in seen["url"]
    assert "id" in seen["params"]["select_cols"]
    assert out == [{"id": 1, "label": "mlblock-a", "actual_status": "running"}]

def test_list_instances_follows_next_token(monkeypatch):
    pages = [_OkInstances([{"id": 1}], "tok"), _OkInstances([{"id": 2}], None)]
    monkeypatch.setattr("mlblock.core.vast.requests.get", lambda url, **kw: pages.pop(0))
    assert [i["id"] for i in VastAI(api_key="real-key").list_instances()] == [1, 2]

def test_list_instances_mock_key_no_http(monkeypatch):
    monkeypatch.setattr("mlblock.core.vast.requests.get", lambda *a, **kw: 1 / 0)
    assert VastAI(api_key="mock-vast-key").list_instances() == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_execution.py -q -k "list_instances"` depuis `backend/`
Expected: FAIL (`list_instances` indéfini).

- [ ] **Step 3: Implement `VastAI.list_instances(status: str | None = None) -> list[dict]` in `backend/mlblock/core/vast.py`**

Pagination `next_token` en boucle, pas de récursion.

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests/test_execution.py -q` depuis `backend/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/core/vast.py backend/mlblock/tests/test_execution.py
git commit -m "feat: list Vast instances via v1 API with pagination"
```

### Task 3: Reaper orphelines hors process web

**Files:**
- Create: `backend/mlblock/reap.py` (`main(grace_s: int = 600, timeout_s: int = 1800) -> int`, garde `if __name__ == "__main__": raise SystemExit(main())`)
- Test: `backend/mlblock/tests/test_execution.py` (règles pures via fakes, pas de HTTP)

**Interfaces:**
- Consumes: Task 1 (`label_for`), Task 2 (`VastAI.list_instances()` sans filtre), `Job.vast_instance_id/status/created_at` (`server/models.py:47-61`), `VastBackend().destroy()` + `cleanup_pipeline_files()` (`execution.py:129-183`).
- Produces: `main()` — exécutable via `uv run python -m mlblock.reap` (zéro nouvel endpoint HTTP ; le Cron Render viendra en ops, hors plan).
- Règles (label `mlblock-{job_id}`, jobs de moins de `grace_s` ignorés) :
  1. Job terminal (`done/error/cancelled`) + instance Vast en `running/loading` → `destroy`.
  2. Job `dispatched/running` vieux de plus de `timeout_s` + instance présente → job `error` (`"GPU TIMEOUT : ..."`), `completed_at`, `destroy`, `cleanup_pipeline_files`.
  3. Job `dispatched/running` + instance en `exited/unknown/offline` (poll trap hello-world) → job `error` (`"Instance Vast.ai ... : <status>"`), `completed_at`, `destroy`.
  4. Instance Vast `running` labellisée `mlblock-*` sans ligne `jobs` correspondante → `destroy` (vraie orpheline).
- Retourne le nombre d'instances détruites (stdout une ligne par action : `destroy <id> <raison>`).

- [ ] **Step 1: Write the failing tests** (fakes : `FakeVast(list_instances=[...])` injecté via monkeypatch sur `mlblock.reap.VastBackend`, fixture `client` existante pour la DB) :

```python
def test_reap_destroys_running_instance_of_terminal_job(client, monkeypatch): ...
def test_reap_marks_timed_out_job_error_and_destroys(client, monkeypatch): ...
def test_reap_marks_exited_instance_error_poll_trap(client, monkeypatch): ...
def test_reap_destroys_labelled_instance_without_job(monkeypatch): ...
def test_reap_spares_freshly_dispatched_job_in_grace(client, monkeypatch): ...
```

Chaque test assert le statut job final et/ou l'id détruit ; le test de grâce crée un job `dispatched` de moins de 600 s avec instance `running` et assert zéro destroy.

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest mlblock/tests/test_execution.py -q -k "reap"` depuis `backend/`
Expected: FAIL (`mlblock.reap` inexistant).

- [ ] **Step 3: Implement `backend/mlblock/reap.py` (`main(grace_s: int = 600, timeout_s: int = 1800) -> int`) selon les 4 règles**

Lecture jobs via `SqlSession(_get_engine())` comme `schedule_orphan_cleanup` ; parsing du job id depuis le label par préfixe `mlblock-` (labels non conformes ignorés).

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest mlblock/tests -q` depuis `backend/`
Expected: PASS (suite complète, pas de régression).

- [ ] **Step 5: Commit**

```bash
git add backend/mlblock/reap.py backend/mlblock/tests/test_execution.py
git commit -m "feat: orphan reaper for Vast instances outside web process"
```
