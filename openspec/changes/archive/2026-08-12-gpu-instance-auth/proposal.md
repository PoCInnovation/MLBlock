## Why

Les callbacks GPU → backend utilisent un `GPU_API_KEY` partagé et statique (même valeur pour tous les jobs, à synchroniser entre Render et le .env local — source du bug 403 connu en session). Une instance compromise peut forger des callbacks pour n'importe quel job. En parallèle, si le backend est injoignable pendant un run GPU, l'instance reste louée jusqu'au timeout (1800 s) — coût GPU + occupation. Vast fournit pourtant une clé par instance (`instance_api_key`, injectée dans le container comme `CONTAINER_API_KEY`) qui résout les deux : authentication des callbacks par instance et auto-destroy en fin de run.

## What Changes

- **Callbacks authentifiés par instance** : le job stocke `instance_api_key` (retournée par le create Vast) ; le code généré utilise `CONTAINER_API_KEY` de l'env du container (fallback `GPU_API_KEY`) pour les callbacks ; `verify_gpu_key` attend la clé de l'instance du job, avec repli sur le `GPU_API_KEY` global pour les jobs legacy.
- **Auto-destroy anti-orpheline** : le script généré récupère son instance id via un nouvel endpoint backend (`GET /api/jobs/{id}/instance`) et détruit l'instance Vast dans un `finally` (succès ou erreur), activé uniquement en présence de `CONTAINER_API_KEY` (aucun effet en mode local).
- **Migration** : colonne `jobs.instance_api_key` (TEXT NOT NULL DEFAULT ''), rétro-compatible.
- Aucun changement frontend.

## Capabilities

### New Capabilities
- `gpu-instance-auth`: authentification des callbacks GPU par instance (clé `CONTAINER_API_KEY`/`instance_api_key`) et auto-destroy de l'instance en fin de run.
