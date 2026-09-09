# Coolify Deployment Guide (Oracle Cloud ARM64 VPS)

This guide walks through deploying **MLBlock** on a self-hosted VPS (`oracle-arm`, Oracle Cloud Ampere A1 ARM64) managed with [Coolify](https://coolify.io), with automated continuous redeployments triggered on pushes to the `main` branch.

---

## 1. Overview & Architecture

- **Host**: `oracle-arm` (configured in `~/.ssh/config` at IP `141.253.110.210`, user `ubuntu`).
- **Hardware Architecture**: Linux ARM64 (`aarch64`, Ampere Altra).
- **Deployment Strategy**: Multi-container Docker Compose stack (`docker-compose.coolify.yml`) orchestrated by Coolify with automatic Traefik SSL/TLS termination via Let's Encrypt.
- **Continuous Deployment**: Automated webhook dispatch via GitHub Actions (`.github/workflows/deploy-coolify.yml`) whenever tests pass on `main`.

```
                GitHub (push to main)
                         │
                         ▼
             GitHub Actions CI/CD Pipeline
        (runs tests, then calls Coolify Webhook)
                         │
                         ▼
             Coolify on oracle-arm (Port 8000)
                         │
                         ▼
        Traefik Reverse Proxy (Ports 80 / 443)
        ┌────────────────┴────────────────┐
        ▼                                 ▼
mlblock-frontend (Nginx)          mlblock-backend (FastAPI)
  port 80 (internal)               port 8000 (internal)
        │                                 │
        ▼                                 ▼
Client Browser                     External Services:
                            - Supabase Postgres (Port 6543)
                            - Supabase Auth / Storage
                            - Vast.ai GPU Dispatch
```

---

## 2. Host Preparation (`oracle-arm`)

Connect to your VPS via SSH:
```bash
ssh oracle-arm
```

### A. Firewall & Port Requirements

Ensure the required ports are accessible:
- **Port 80 / 443**: Ingress HTTP and HTTPS for application traffic (Traefik).
- **Port 8000**: Coolify Web Dashboard & API.
- **Port 6001**: Soketi / Real-time updates (Coolify internal).
- **Port 22**: SSH administration.

In **Oracle Cloud Console** (Networking -> Virtual Cloud Networks -> VCN -> Security Lists -> Ingress Rules):
- Add Ingress Rule: Source `0.0.0.0/0`, IP Protocol `TCP`, Destination Port Range: `80, 443, 8000`.

On the Ubuntu host, update `iptables` or `ufw` if enabled:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
sudo netfilter-persistent save
```

### B. Configure Swap Memory (Recommended for ARM64 builds)

Building Docker images containing Python packages like PyTorch can require additional temporary memory:
```bash
# Check existing swap
free -h

# Create a 4GB swapfile if none exists
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Coolify Installation (if not installed)

If Coolify is not yet installed on `oracle-arm`:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Once installation finishes, navigate to:
```
http://141.253.110.210:8000
```
Create the initial administrative account and save your credentials.

---

## 4. Configuring MLBlock in Coolify

1. **Create Project & Environment**:
   - In Coolify, click **Projects** -> **+ Add**.
   - Name it `MLBlock` and select the `production` environment.

2. **Add Resource**:
   - Click **+ New Resource** -> **Git Repository (GitHub, GitLab, etc.)**.
   - Connect your Git provider or select **Public Repository** / **Custom Git Repository**.
   - Repository URL: your repository (e.g. `https://github.com/your-org/mlblock`).
   - Branch: `main`.
   - Build Pack: Select **Docker Compose**.
   - Docker Compose Location: `docker-compose.coolify.yml`.

3. **Domains & Routing**:
   - In Coolify, open the MLBlock resource. Because it is a Docker Compose application, Coolify discovers both services:
     - **frontend**: In the service settings / Domains input, enter `http://frontend.141.253.110.210.sslip.io` (or with `https://`).
     - **backend**: In the service settings / Domains input, enter `http://backend.141.253.110.210.sslip.io:8000` (or with `https://`).
   - Coolify's built-in proxy handles all routing, network attachment, and Let's Encrypt certificates automatically without needing manual Traefik labels in the compose file.
---

## 5. Environment Variables Configuration

Under the application's **Environment Variables** tab in Coolify, add the following variables:

### Required Backend Variables

| Variable | Description | Example / Notes |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres pooler connection string | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require` |
| `SUPABASE_URL` | Supabase project URL | `https://[ref].supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable / anon key | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase service role / secret key | `eyJhbGciOi...` |
| `SUPABASE_JWKS_URL` | Supabase JWKS verification URL | `https://[ref].supabase.co/auth/v1/.well-known/jwks.json` |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret | Found in Supabase API settings |
| `VAST_API_KEY` | Vast.ai API Key for GPU rentals | API key from Vast.ai console |
| `MLBLOCK_RUN_MODE` | Execution mode | `gpu` (or `local` for testing) |
| `CORS_ORIGINS` | Allowed frontend origin | `https://mlblock.yourdomain.com` |
| `BACKEND_URL` | Public backend URL for GPU callbacks | `https://api.mlblock.yourdomain.com` |
| `GPU_API_KEY` | Secret token for GPU callback auth | Random 32+ character string |

> **Gotcha**: Remember to percent-encode special characters in your `DATABASE_URL` password (`?` -> `%3F`, `@` -> `%40`, `*` -> `%2A`), and use pooler port `6543` (transaction mode).

### Required Frontend Build Variables

| Variable | Description | Example / Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Public backend URL baked into bundle | `https://api.mlblock.yourdomain.com` |
| `VITE_SUPABASE_URL` | Public Supabase URL | `https://[ref].supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Supabase Key | `sb_publishable_...` |
| `SITE_URL` | Public frontend URL | `https://mlblock.yourdomain.com` |

---

## 6. Automated Redeployment on Push to `main`

MLBlock uses a two-tier CI/CD approach to guarantee that only commits passing tests are deployed to production.

### Step A: Retrieve Coolify Webhook URL & Token

1. In the Coolify dashboard, open your MLBlock resource.
2. Go to **Webhooks** (or **Deployments** -> **Webhooks**).
3. Copy the **Deploy Webhook URL** (e.g. `http://141.253.110.210:8000/api/v1/deploy?uuid=...`).
4. Under your Coolify profile (**Keys & Tokens** -> **API Tokens**), create a token with deployment permissions and copy it.

### Step B: Add Secrets to GitHub Repository

In your GitHub repository:
1. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   - `COOLIFY_WEBHOOK_URL`: Paste the Coolify deploy webhook URL.
   - `COOLIFY_API_TOKEN`: Paste the Coolify Bearer API token.

### Step C: Verification

Whenever a commit is pushed or merged to `main`:
1. `.github/workflows/ci.yml` runs full backend and frontend checks.
2. Upon success, `.github/workflows/deploy-coolify.yml` triggers the Coolify deployment webhook.
3. Coolify pulls the latest commit, builds the multi-stage Docker images on `oracle-arm`, verifies container health checks (`/healthz`), and performs a zero-downtime rolling restart.

---

## 7. Operational Verification & Troubleshooting

### Check Health Endpoints
- Backend: `curl -f https://api.mlblock.yourdomain.com/healthz` (should return `{"status":"ok","run_mode":"gpu"}`)
- Frontend: `curl -f https://mlblock.yourdomain.com/healthz` (should return `healthy`)

### View Container Logs via Coolify or CLI
On the `oracle-arm` server:
```bash
# View backend logs
docker logs -f mlblock-backend

# View frontend logs
docker logs -f mlblock-frontend
```
