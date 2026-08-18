# ruff: noqa: E402 -- load_dotenv() doit précéder les imports internes : main.py,
# database.py et auth.py lisent les variables d'env au module-level.
import os
import uuid
from uuid import UUID

import pytest
import requests
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

load_dotenv()

from mlblock.server.main import app
from mlblock.server.database import get_session
from mlblock.server.auth import get_current_user
from mlblock.server.gpu_auth import verify_gpu_key
from mlblock.server.models import Pipeline as PipelineTable
from sqlmodel import delete as sql_delete

_SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
_SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
_test_user_id: str | None = None


def _admin_headers() -> dict:
    return {
        "apikey": _SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {_SUPABASE_SERVICE_KEY}",
    }


def _ensure_test_user() -> str:
    """Crée (une seule fois) un utilisateur auth dédié aux tests via l'Admin API.
    Le trigger on_auth_user_created crée son profil → la FK pipelines.user_id
    → profiles est satisfaite. L'utilisateur est réutilisé par tous les tests ;
    le nettoyage des pipelines se fait par test (voir le fixture client)."""
    global _test_user_id
    if _test_user_id:
        return _test_user_id
    if not _SUPABASE_URL or not _SUPABASE_SERVICE_KEY:
        pytest.skip("Supabase admin API non configurée (SUPABASE_URL/SUPABASE_SECRET_KEY)")
    email = f"test-{uuid.uuid4().hex[:10]}@mlblock.test"
    r = requests.post(
        f"{_SUPABASE_URL}/auth/v1/admin/users",
        json={"email": email, "password": "Test-1234!"},
        headers=_admin_headers(),
        timeout=15,
    )
    if r.status_code not in (200, 201):
        pytest.skip(f"Création user admin impossible: {r.status_code} {r.text[:120]}")
    _test_user_id = r.json()["id"]
    return _test_user_id


@pytest.fixture(name="catalog_client")
def catalog_client_fixture():
    """Client sans DB ni Supabase : pour les routes sans dépendance base
    (catalogue des blocs) — fonctionne aussi en CI sans secrets."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(name="client")
def client_fixture():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set")

    engine = create_engine(
        database_url,
        poolclass=StaticPool,
        connect_args={"options": "-c statement_timeout=10000"},
    )

    def override_get_session():
        with Session(engine) as session:
            yield session

    test_user_id = _ensure_test_user()
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = lambda: test_user_id
    app.dependency_overrides[verify_gpu_key] = lambda: "gpu"

    with TestClient(app) as c:
        yield c

    # Nettoyage par test : pipelines du user de test (cascade jobs/job_outputs)
    with Session(engine) as session:
        session.exec(sql_delete(PipelineTable).where(PipelineTable.user_id == UUID(test_user_id)))
        session.commit()

    app.dependency_overrides.clear()
