## Context

Le backend exécute les pipelines ML en local (subprocess, `MLBLOCK_RUN_MODE=local` par défaut) ou sur GPU Vast.ai (Render force `gpu`). Le cycle GPU actuel :

1. `POST /pipelines/{id}/execute` → code généré (`generator.py`) → `VastAI.launch_instance` (search + rent) → `job.vast_instance_id` = `new_contract`.
2. L'onstart embarque le code : `pip install … && python - <<'MLBLOCK_EOF'`.
3. Le script généré appelle `POST /api/jobs/{id}/status|output|error` avec `Authorization: Bearer GPU_API_KEY` (clé partagée : Render `generateValue`, .env local placeholder — d'où le bug 403 de sync).
4. `verify_gpu_key` (stateless, Header → str) compare au `GPU_API_KEY` global.
5. Le backend détruit l'instance à la réception de `status=done|error` et au timeout (`MLBLOCK_GPU_TIMEOUT`).

Vast retourne au create une `instance_api_key` (clé restreinte : start/stop/destroy de **cette** instance uniquement), injectée automatiquement dans le container comme `CONTAINER_API_KEY` (documenté dans le hello-world API ; le SDK officiel ne la touche pas). Le container ne connaît pas son propre id (`new_contract` est connu du backend seulement, l'onstart partant avant le create).

## Goals / Non-Goals

**Goals:**
- Callbacks GPU authentifiés par instance : `Bearer` = clé de l'instance du job, plus de secret partagé à synchroniser.
- Auto-destroy anti-orpheline : l'instance se détruit elle-même en fin de run (succès ou erreur) même si le backend est down — pas d'instance louée au-delà du run.
- Rétro-compatibilité : les jobs sans `instance_api_key` (legacy, mode local) continuent de passer par le `GPU_API_KEY` global.

**Non-Goals:**
- Gestion du polling d'état Vast (`show_instance`/`actual_status`) — le design onstart+callbacks est conservé.
- Chiffrement de la clé en transit ou au repos au-delà de ce que la plateforme fournit (la clé vit dans l'env du container et en DB).
- Usage 1 alternatif « le container trouve son id via l'API Vast (`GET /instances/` avec clé restreinte) » — non documenté, différé en spike payant éventuel.

## Decisions

### D1 — La clé par instance vit sur le job
`Job.instance_api_key: str = ""` (SQLModel + migration `ALTER TABLE jobs ADD COLUMN instance_api_key TEXT NOT NULL DEFAULT ''`). `launch_instance` retourne `{"id":…, "api_key": res.json().get("instance_api_key","")}` ; `routes.py` la stocke après le create.
*Alternative* : table séparée / secret manager — surdimensionné pour un PoC ; la DB détient déjà `VAST_API_KEY` (contrôle total), donc une fuite DB est déjà le pire cas.

### D2 — Le code généré préfère `CONTAINER_API_KEY`
`generator.py` : `GPU_API_KEY = os.environ.get('GPU_API_KEY') or os.environ.get('CONTAINER_API_KEY', 'mock-gpu-key')`. L'instance se présente avec sa clé native ; le fallback couvre local (mock) et les anciens runs. Zéro changement de signature des callbacks.

### D3 — `verify_gpu_key` devient job-aware sans changer les routes
`gpu_auth.py` : `verify_gpu_key(authorization: Header, request: Request, session: Session = Depends(get_session))` — lit `request.path_params["job_id"]`, attend `job.instance_api_key or GPU_API_KEY`. Les 3 routes et les `dependency_overrides` de test restent intacts (la fonction est remplacée en entier par l'override).
*Alternative* : vérification inline dans chaque handler — duplique la logique et fuite le 404/403 (job inexistant → 403 ici, pas de fuite).

### D4 — L'instance trouve son id via le backend (endpoint relais)
Nouvel endpoint `GET /api/jobs/{id}/instance` (auth `verify_gpu_key`) → `{"instance_id": job.vast_instance_id}`. Le script l'appelle au boot (`_fetch_instance_id`), détruit dans un `finally` (`_self_destroy`).
*Alternatives* : (a) `GET /instances/` Vast avec la clé restreinte — non documenté, non testable sans louer ; (b) lire l'id dans la réponse d'un callback — couplage sournois (réponse d'un POST status). Endpoint dédié : explicite, testable immédiatement.

### D5 — Le self-destroy est activé par la présence de `CONTAINER_API_KEY`
`_self_destroy()` no-op si `CONTAINER_API_KEY` absent → aucun effet en mode local. Le destroy est idempotent avec celui du backend (2e DELETE → 404 ignoré). Ordre garanti : callbacks → `finally` → destroy.

## Risks / Trade-offs

- **`CONTAINER_API_KEY` non vérifiée en réel** : la doc l'affirme, mais aucun run GPU n'a encore réussi. Si absente de l'env : les callbacks retombent sur `GPU_API_KEY` global (comportement actuel) et le self-destroy est no-op — dégradation douce, pas de régression.
- **Backend down dès le boot** : `_fetch_instance_id` échoue → pas de destroy → orpheline jusqu'au redémarrage du backend (le timeout 1800 s vit dans le process backend). Couvert partiellement ; le cas complet (a) est différé en spike.
- **Fuite d'existence de jobs** : l'endpoint `/instance` répond 404 (job inexistant) avant la vérif de clé → un appelant peut distinguer 404/403. UUID aléatoires, risque négligeable.
- **Double destroy** : GPU puis backend — 404 ignoré, idempotent.
