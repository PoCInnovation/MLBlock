## Purpose

Provides containerization, multi-service Docker Compose orchestration, and automated continuous redeployment pipelines for hosting MLBlock on self-hosted VPS environments via Coolify.

## Requirements

### Requirement: Multi-Architecture Containerization
The deployment system SHALL provide container specifications for both backend and frontend services that successfully build and execute on Linux ARM64 (`linux/arm64`) architectures.

#### Scenario: Backend container build and execution
- **WHEN** the backend Docker container is built on an ARM64 host
- **THEN** dependencies are resolved via `uv`, the FastAPI application initializes without missing architecture-specific binary dependencies, and listens on the designated HTTP port

#### Scenario: Frontend container build and SPA routing
- **WHEN** the frontend container is built and served via Nginx
- **THEN** client assets are compiled using Node 20 (`npm`), static files are served with caching headers, and non-asset route requests are rewritten to `/index.html` to support client-side routing

### Requirement: Orchestrated Service Deployment via Docker Compose
The system SHALL provide a production Docker Compose specification (`docker-compose.coolify.yml`) defining backend and frontend services, internal bridge networking, explicit container healthchecks, and resource constraints.

#### Scenario: Service healthcheck validation
- **WHEN** services are launched via Docker Compose in Coolify
- **THEN** the backend container exposes a passing HTTP health check at `/healthz` and the frontend container reports healthy status via HTTP status 200 on `/`

#### Scenario: Inter-service communication and CORS
- **WHEN** a client initiates an API request from the frontend domain
- **THEN** the backend accepts requests originating from the configured frontend origin without CORS rejection and resolves database connections via external Supabase poolers

### Requirement: Automated Continuous Redeployment on Main Branch Push
The deployment infrastructure SHALL support automated redeployment triggers when commits are merged or pushed to the `main` branch.

#### Scenario: Push event triggers deployment
- **WHEN** a commit is pushed to the `main` branch of the repository
- **THEN** a deployment trigger is delivered to Coolify via an authenticated webhook or GitHub integration, initiating an automated pull, build, and zero-downtime rolling restart of the application services

#### Scenario: Secure webhook verification
- **WHEN** an automated redeployment request is transmitted to Coolify
- **THEN** the request MUST be authenticated with a configured bearer token or secret header, rejecting unauthorized or unverified deployment calls

### Requirement: Production Environment and Secret Management
The deployment configuration SHALL inject configuration parameters and secrets via environment variables without hardcoding credentials into container images or repository assets.

#### Scenario: Backend runtime configuration injection
- **WHEN** the backend container initializes
- **THEN** it retrieves database connection strings, Supabase credentials, Vast.ai API keys, and GPU callback URLs from the environment and validates required settings at startup

#### Scenario: Frontend build-time API base URL injection
- **WHEN** the frontend container image is compiled
- **THEN** `VITE_API_BASE_URL` is passed as a build argument or build environment variable and baked into the client bundle pointing to the production backend URL
