# Keep-alive du backend (Render free tier)

## Pourquoi

Le backend Render (`mlblock-backend`, plan free) s'endort après **15 minutes sans trafic** (spin-down). Chaque premier chargement subit alors un cold start (~8-15 s). Pour éliminer cette friction, un moniteur externe ping `/health` en continu — le backend ne s'endort jamais.

## Endpoint

- `GET /health` → `200 {"status": "ok"}` — aucune requête DB, coût négligeable (cible des sondes uniquement).

## Setup du keep-alive

Le mécanisme ne fonctionne que si **un pinger tourne réellement** — l'endpoint seul ne maintient rien.

### Option 1 (recommandée, code-only) — GitHub Actions cron

Le repo embarque `.github/workflows/keep-alive.yml` : un job planifié qui curl `/health` toutes les 10 min. Aucun compte externe, minutes illimitées (repo public). Il s'active dès qu'il est sur la branche par défaut.

- Vérifier l'exécution : onglet **Actions** du repo → workflow `keep-alive` → runs toutes les 10 min
- Caveat GitHub : les crons sont désactivés si le repo est inactif 60 jours (notre cas : actif)

### Option 2 — UptimeRobot (compte externe)

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com) (plan gratuit : 50 monitors).
2. **Add New Monitor** :
   - Monitor Type : **HTTP(s)**
   - URL : `https://mlblock-backend.onrender.com/health`
   - Intervalle : **5 minutes** (ou 10 — doit rester < 15 min, la fenêtre de spin-down)
   - Alert Contacts : ton email (notification en cas d'échec)
3. Sauvegarder — le monitor démarre le ping immédiatement.

Alternatives : [cron-job.org](https://cron-job.org) (gratuit, intervalle 1 min-1 h) — même principe, `POST`/`GET` sur `/health`.

## Arithmétique du quota (à surveiller)

| Ressource | Consommation | Quota free tier | Marge |
|---|---|---|---|
| Instance-heures | ~720 h/mois (24/7) | **750 h/mois** | ~30 h (**96 %**) |
| Bande passante (pings) | ~9 Mo/mois | 100 Go/mois | négligeable |

**Risque** : à 96 % d'utilisation, un déploiement avec double instance pendant la bascule ou un jour d'incident peut dépasser 750 h → **Render stoppe le service jusqu'au mois suivant** (pire que le spin-down).

**Mitigations :**
- Intervalle 10-12 min (moins de requêtes, toujours < 15 min).
- Vérifier `Usage` dans le dashboard Render en fin de mois.
- **Repli (option B)** : si le quota approche, passer le monitor en pings heures utiles (ex. 8 h-20 h via la maintenance window d'UptimeRobot) → consommation ~50 %.

## Notes

- L'éviction free tier (instance partagée redémarrée par Render) reste possible — le pinger rend le cold start rare, pas impossible.
- Le frontend garde son retry `fetchCatalog` (5×15 s) en filet de sécurité.
