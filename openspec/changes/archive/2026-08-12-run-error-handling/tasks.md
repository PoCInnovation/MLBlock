## 1. Backend

- [x] 1.1 `routes.py` execute_pipeline : `session.refresh(job)` avant les 3 `return job` (branche locale, dummy gpu, dispatched gpu)
- [x] 1.2 Test de régression : `execute` (mode gpu, `launch_instance` mocké → dummy) retourne un JSON avec `id` non vide + `status` (error) — dans test_server.py

## 2. Frontend

- [x] 2.1 `useBlockRunner.onRun` : après `executePipeline` — `!job?.id` → console « statut indisponible » + failRun ; `job.status === 'error'` → console « Exécution en erreur : {job.error} » + failRun ; sinon setLastJob + pollJob
- [x] 2.2 `pollJob` : dans le catch — arrêt net + message si `err.response?.status` est 4xx hors 429 ; sinon continuer
- [x] 2.3 Build frontend : `npm run build` OK

## 3. Validation

- [x] 3.1 Backend : reproduction locale (mode gpu, clé réelle, rent refusé) — `execute` répond avec `id` + `status: error` + message FR
- [x] 3.2 Suite pytest : 92 + nouveaux, 7 pré-existants `/api/blocks*`
- [x] 3.3 Smoke navigateur : run sur Render → erreur de location affichée dans la console (pas de faux succès, pas de boucle 422)
- [x] 3.4 Commit + push dev/chedli + fast-forward main