# Backend Health Endpoint

## Purpose

Endpoint de santé léger (`/health`) servant de cible aux moniteurs de disponibilité qui maintiennent le backend Render éveillé.

## Requirements

### Requirement: Endpoint de santé
The backend MUST expose `GET /health` returning `200 {"status": "ok"}` without touching the database or loading extra heavy modules. It MUST serve as the ping target for uptime monitors.

#### Scenario: Sonde de disponibilité
- **WHEN** un pinger externe interroge `GET /health`
- **THEN** la réponse est 200 avec `{"status": "ok"}`, sans accès DB

#### Scenario: Pas d'effet de bord
- **WHEN** `/health` est appelé pendant le fonctionnement normal
- **THEN** aucune requête base, aucun coût notable

### Requirement: Ping externe 24/7
A free external uptime monitor (UptimeRobot or cron-job.org) MUST be configured on `https://mlblock-backend.onrender.com/health` with an interval below the 15-minute spin-down window, keeping the backend awake 24/7. The setup MUST be documented in the repo (README or ops doc) with the quota arithmetic (720/750 instance-hours per month, ~96 %).

#### Scenario: Backend jamais endormi
- **WHEN** le pinger tourne à intervalle < 15 min
- **THEN** le backend ne s'endort pas, les premiers chargements n'ont pas de cold start

#### Scenario: Documentation du quota
- **WHEN** un mainteneur lit la doc keep-alive
- **THEN** elle indique le monitor UptimeRobot, l'intervalle, l'arithmétique 720/750 h et le repli (pings heures utiles) si le quota approche
