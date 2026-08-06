# Design: backend-keep-alive

## Context

Le service Render `mlblock-backend` est en plan `free` (render.yaml) : spin-down après 15 min d'inactivité, quota de **750 instance-heures/mois**, 100 Go de bande passante. Le frontend compense déjà le cold start (retry `fetchCatalog` 5×15 s, timeout axios 60 s). Le backend n'a pas d'endpoint de santé — `GET /` → 404. Décision utilisateur : **option A** — garder le backend éveillé 24/7 via un pinger externe.

## Goals / Non-Goals

**Goals:**
- Endpoint `/health` léger (200, sans DB) cible des sondes.
- Pinger externe gratuit documenté, intervalle < 15 min.

**Non-Goals:**
- Changement de plan Render (payant) — hors périmètre.
- Garder éveillé via le frontend (ne couvre pas l'absence d'utilisateurs).
- Supabase/Redis self-host — non pertinent (DB = Supabase externe).

## Decisions

### D1 — Endpoint `/health`
Nouveau `health_router` (prefix `/api/health` non requis — chemin racine `/health`) : retourne `{"status": "ok"}` en 200, aucun accès DB, aucun import lourd supplémentaire (le module est déjà chargé). Registré dans `main.py` comme les autres routers.
- *Pourquoi racine* : cible simple pour un pinger, sans préfixe API.
- *Alternative* : réutiliser `/api/catalog` — rejeté (parse + sérialise le catalogue, plus lourd que nécessaire).

### D2 — Pinger externe 24/7
UptimeRobot (plan gratuit : 50 monitors, intervalle minimal 5 min) ou cron-job.org (gratuit, intervalle 1 min-1 h). Configuration documentée :
```
UptimeRobot monitor → HTTP(S) → https://mlblock-backend.onrender.com/health
                      intervalle : 5-10 min (< 15 min de spin-down)
```
Le pinger est **externe au repo** (compte UptimeRobot) — le repo documente le setup (README/ops doc) ; aucune dépendance de code.

### D3 — Arithmétique de quota assumée
24/7 = ~720 h/mois sur 750 h (**96 %**). Bande passante des pings : ~9 Mo/mois sur 100 Go (négligeable). Risque : un déploiement avec double instance pendant la bascule, ou un jour d'incident, peut dépasser 750 h → Render stoppe le service jusqu'au mois suivant (pire que spin-down). Atténuations :
- intervalle 10-12 min (moins de requêtes, toujours < 15 min) ;
- surveiller la consommation d'heures dans le dashboard Render ;
- repli : passer en pings heures utiles (option B) si le quota approche.

## Risks / Trade-offs

- **Dépassement de quota** : le risque existe à 96 % d'utilisation — documenté, surveillé, repli B prévu.
- **UptimeRobot compte tiers** : clé/alerte email à créer — hors code, à faire une fois.
- **Health endpoint public** : aucun risque (aucune donnée exposée, 200 statique).
- **Éviction free tier** : Render peut redémarrer l'instance partagée à tout moment — le pinger ne garantit pas zéro cold start, mais le rend rare.
