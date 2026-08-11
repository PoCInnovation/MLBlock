## 1. Modèle et migration

- [x] 1.1 Ajouter `Job.instance_api_key: str = ""` dans `backend/mlblock/server/models.py`
- [x] 1.2 Appliquer la migration Supabase `ALTER TABLE jobs ADD COLUMN instance_api_key TEXT NOT NULL DEFAULT ''`

## 2. Client Vast

- [x] 2.1 `VastAI.launch_instance` retourne aussi `api_key` : `res.json().get("instance_api_key", "")` (mock → `""`)

## 3. Backend — auth par instance

- [x] 3.1 `gpu_auth.py` : `verify_gpu_key` job-aware — lire `request.path_params["job_id"]`, attendre `job.instance_api_key or GPU_API_KEY` (session DB via `Depends(get_session)`)
- [x] 3.2 `routes.py` execute (gpu) : stocker `job.instance_api_key = instance.get("api_key", "")` après le create
- [x] 3.3 Ajouter `GET /api/jobs/{id}/instance` → `{"instance_id": job.vast_instance_id}` (auth `verify_gpu_key`, 404 si job inexistant)

## 4. Code généré

- [x] 4.1 `generator.py` : `GPU_API_KEY = os.environ.get('GPU_API_KEY') or os.environ.get('CONTAINER_API_KEY', 'mock-gpu-key')`
- [x] 4.2 `generator.py` : `_fetch_instance_id()` au boot de `main()` (GET /api/jobs/{id}/instance, no-op sans `CONTAINER_API_KEY`)
- [x] 4.3 `generator.py` : `_self_destroy()` dans le `finally` de `main()` (DELETE Vast avec `CONTAINER_API_KEY`, no-op si absent ou sans id)

## 5. Tests

- [x] 5.1 Test : callback accepté avec la clé de l'instance du job (`job.instance_api_key`), rejeté avec une autre clé (403)
- [x] 5.2 Test : job sans clé d'instance → repli sur le `GPU_API_KEY` global (accepté)
- [x] 5.3 Test : `GET /api/jobs/{id}/instance` retourne l'instance id (et 404 si job absent)
- [x] 5.4 Test : le code généré contient le fallback `CONTAINER_API_KEY` et les helpers `_fetch_instance_id`/`_self_destroy`
- [x] 5.5 Lancer `uv run python -m pytest mlblock/tests` (92 passed + nouveaux, 7 pré-existants `/api/blocks*`)

## 6. Validation

- [x] 6.1 Smoke : run local (mode par défaut) d'un pipeline — callbacks mock acceptés, aucun destroy tenté
- [x] 6.2 Commit + push dev/chedli + fast-forward main (message : « gpu-instance-auth: callbacks par instance + auto-destroy »)