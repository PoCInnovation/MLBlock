## Context

La route `execute_pipeline` (routes.py) crée le job, génère le code, tente la location Vast (ou lance le subprocess local), puis `session.commit()` et `return job`. SQLAlchemy/SQLModel a `expire_on_commit=True` par défaut : après `commit()`, le `__dict__` de l'instance est vidé et les attributs ne sont rechargés que lors d'un accès (lazy) ou d'un `refresh()`.

Reproduction prouvée : mode gpu + rent refusé (400 insufficient_credit) → `execute` répond `200 {}` (0 champ) alors que `get_job` (session.get) répond `200` avec les 11 champs. `session.refresh(job)` avant sérialisation → 11 champs. La branche locale « survivait » par accident : l'accès `job.id` après le commit (ligne `job_id = job.id`) rechargeait l'instance avant le return.

Côté frontend : `useBlockRunner.onRun` appelle `pollJob(job.id)` sans vérifier `job.id` ni `job.status` → avec un job vide, `pollJob("undefined")` boucle sur `GET /api/jobs/undefined → 422` (le catch continue indéfiniment, seule la limite `tries > 40` arrête après 120 s), et `finishRun(build)` est appelé juste après → faux succès.

## Goals / Non-Goals

**Goals:**
- `execute` retourne toujours un job sérialisé complet (id, status, error).
- Le frontend affiche l'erreur du job (ex. « Location GPU Vast.ai impossible… ») immédiatement, sans polling ni faux succès.
- Le polling s'arrête sur les erreurs permanentes (4xx).

**Non-Goals:**
- Changer le comportement de `get_session` globalement (`expire_on_commit=False`) — impact large, non nécessaire.
- Modifier le message d'erreur backend existant (déjà en français et pertinent).
- Gérer les erreurs GPU côté Vast (location) — hors périmètre, le backend les traduit déjà en job error.

## Decisions

### D1 — `session.refresh(job)` avant chaque return de `execute_pipeline`
Les 3 retours (branche local, dummy gpu, dispatched gpu) rechargent l'instance depuis la DB avant le `return job` → la sérialisation FastAPI est complète.
*Alternatives* : `expire_on_commit=False` sur la session (impact global, risque de lectures stale) ; retourner un dict construit manuellement (duplique le schéma). Refresh : localisé, standard.

### D2 — Frontend : pas de polling sur job invalide ou déjà en erreur
Dans `onRun`, après `executePipeline` :
- `!job?.id` → console « statut de l'exécution indisponible » + `failRun`, return (aucun polling).
- `job.status === 'error'` → console « Exécution en erreur : {job.error} » + `failRun`, return (le cas budget — affiché sans attendre le polling).
- Sinon → `setLastJob(job)` + `pollJob(job.id)`.
`failRun` met l'état d'échec global (running=false) — cohérent avec les autres chemins d'erreur.

### D3 — `pollJob` : arrêt net sur 4xx
Dans le `catch` de `pollJob` : si `err.response?.status` est un 4xx hors 429 → `clearInterval` + console « job introuvable/statut indisponible » (erreur permanente, jamais résolue). Réseau/5xx → comportement actuel (continuer, limite `tries > 40`).

### D4 — Test de régression backend
Test unitaire : `execute_pipeline` (mode gpu mocké — `launch_instance` force dummy) retourne un JSON avec `id` non vide et `status` (error). Le mock remplace `VastAI.launch_instance` pour éviter tout appel réseau réel.

## Risks / Trade-offs

- **Refresh = requête DB supplémentaire** par exécution — négligeable (1 SELECT par run).
- **Job déjà en erreur au retour** : le frontend n'appelle plus jamais `getJobOutputs` pour ce job (l'erreur de location n'a pas de sorties) — comportement souhaité.
- **4xx dans pollJob** : un 401/403 (clé expirée) arrêterait aussi le polling — acceptable (erreur permanente, pas de résolution sans action utilisateur).
