## 1. Endpoint /health

- [x] 1.1 `health_router` dans `routes.py` : `GET /health` → `{"status": "ok"}` (200, sans DB)
- [x] 1.2 Enregistrer le router dans `main.py`
- [x] 1.3 Test backend : `/health` → 200 `{"status": "ok"}` (TestClient sans DB)

## 2. Pinger externe

- [x] 2.1 Documenter le setup UptimeRobot dans `docs/` (monitor HTTP → URL `/health`, intervalle 5-10 min, alerte email)
- [x] 2.2 Documenter l'arithmétique de quota (720/750 h, ~96 %, bande passante ~9 Mo/mois) + repli heures utiles

## 3. Vérification

- [x] 3.1 pytest backend (test `/health` inclus, suite complète sans régression)
- [x] 3.2 Smoke : `curl /health` → 200 ; les autres routes inchangées
