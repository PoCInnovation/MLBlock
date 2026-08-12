## Why

Quand une exécution GPU échoue (ex. pas de budget Vast.ai), le backend met le job en `error` avec un message clair, mais **le frontend reçoit un job vide** : la route `execute` sérialise l'instance SQLModel après `commit()`, or SQLAlchemy l'expire (expire_on_commit) → réponse `{}` → le frontend poll `GET /api/jobs/undefined` en boucle (422) et affiche un faux succès (« Build réussi ») au lieu de l'erreur réelle. Root cause reproduite en local : `execute → 200 {}` vs `get_job → 200 {11 champs}` ; `refresh` avant sérialisation restaure les 11 champs.

## What Changes

- **Backend** : `session.refresh(job)` avant chacun des 3 `return job` de `execute_pipeline` — l'instance retournée est complète (id, status, error…). Les autres routes sont déjà saines (create/update font refresh).
- **Frontend** : `useBlockRunner` — après `executePipeline`, ne pas lancer le polling sur un job invalide (`!job?.id`) ni sur un job déjà en erreur (`status === 'error'`) ; afficher l'erreur du job immédiatement (console + état échec). `pollJob` s'arrête net sur erreur 4xx (hors 429) — un 422 ne se résoudra jamais ; les erreurs réseau/5xx continuent (wake-up Render) avec la limite existante.
- **Test de régression** : `execute` retourne un job sérialisé complet (id présent) en mode gpu avec rent en échec (mocké).

## Capabilities

### New Capabilities
- `run-error-handling`: gestion des erreurs d'exécution de pipeline côté API (sérialisation du job) et frontend (affichage immédiat de l'erreur, arrêt du polling sur job invalide).
