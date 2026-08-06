# Proposal: backend-keep-alive

## Why

Le backend free tier Render s'endort après 15 min sans trafic → chaque premier chargement du frontend subit un cold start (~8-15 s, masqué par le retry frontend mais perceptible). L'utilisateur veut un backend jamais endormi (option A : ping externe 24/7), ce qui exige un endpoint de santé léger comme cible de ping — `GET /` renvoie actuellement 404.

## What Changes

- **Endpoint `/health`** : réponse 200 sans toucher la base (léger, dédié aux sondes), en plus des routes existantes.
- **Pinger externe 24/7** : UptimeRobot (ou cron-job.org) configuré sur `https://mlblock-backend.onrender.com/health` à intervalle 5-10 min (< 15 min → jamais endormi) — documentation du setup + arithmétique de quota.
- **Quota assumé** : 720 h/mois d'instance sur 750 h (96 %) — risque de dépassement documenté avec atténuations (intervalle 10-12 min).

## Capabilities

### New Capabilities
- `backend-health-endpoint`: endpoint `/health` 200 sans DB, cible des sondes.
- `backend-keep-alive`: pinger externe 24/7 documenté (UptimeRobot/cron-job.org), arithmétique de quota.

### Modified Capabilities
<!-- Aucune spec existante — capabilities nouvelles. -->
