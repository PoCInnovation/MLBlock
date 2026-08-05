from __future__ import annotations

import os
import uuid

import pytest
import requests
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")


@pytest.fixture()
def real_auth_client():
    """Client with real JWT auth — no dependency overrides for get_current_user."""
    from mlblock.server.main import app
    from mlblock.server.database import get_session

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


def _signup_user(email: str, password: str) -> dict:
    """Create user via Supabase Admin API (auto-confirmed), return tokens."""
    # Use admin API to create user directly (auto-confirms email)
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
        },
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    if resp.status_code not in (200, 422):
        raise RuntimeError(f"Admin user creation failed: {resp.status_code} {resp.json()}")

    data = resp.json()
    user_id = data.get("id", "")

    # Sign in to get the JWT
    return _signin_user(email, password, user_id)


def _signin_user(email: str, password: str, user_id: str = "") -> dict:
    """Sign in via Supabase Auth API, return {access_token, user_id, refresh_token}."""
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    data = resp.json()
    if resp.status_code != 200:
        raise RuntimeError(f"Signin failed: {resp.status_code} {data}")

    # Supabase returns token at top level, not nested in session
    access_token = data.get("access_token", "")
    if not access_token:
        raise RuntimeError(f"No access_token in signin response: {data}")

    return {
        "access_token": access_token,
        "refresh_token": data.get("refresh_token", ""),
        "user_id": user_id or data.get("user", {}).get("id", ""),
    }


def _delete_user(user_id: str, admin_token: str) -> None:
    """Delete user via Supabase Admin API (service_role key)."""
    requests.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        timeout=15,
    )


@pytest.mark.skipif(not SUPABASE_URL, reason="SUPABASE_URL not set")
def test_auth_valid_token_accepted(real_auth_client: TestClient):
    """A valid Supabase JWT is accepted by a protected endpoint."""
    test_id = uuid.uuid4().hex[:8]
    email = f"test-auth-{test_id}@mlblock-test.io"
    password = f"TestPass-{test_id}!"
    user_info = None

    try:
        user_info = _signup_user(email, password)
        token = user_info["access_token"]

        resp = real_auth_client.get(
            "/api/blocks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] > 0
    finally:
        if user_info and user_info.get("user_id"):
            _delete_user(user_info["user_id"], SUPABASE_SERVICE_KEY)


@pytest.mark.skipif(not SUPABASE_URL, reason="SUPABASE_URL not set")
def test_auth_invalid_token_rejected(real_auth_client: TestClient):
    """A forged/bad JWT is rejected with 401."""
    resp = real_auth_client.get(
        "/api/blocks",
        headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
    )
    assert resp.status_code == 401


@pytest.mark.skipif(not SUPABASE_URL, reason="SUPABASE_URL not set")
def test_auth_no_token_rejected(real_auth_client: TestClient):
    """No Authorization header returns 401."""
    resp = real_auth_client.get("/api/blocks")
    assert resp.status_code == 401


@pytest.mark.skipif(not SUPABASE_URL, reason="SUPABASE_URL not set")
def test_auth_user_id_scoped_to_owner(real_auth_client: TestClient):
    """Each user only sees their own pipelines."""
    test_id = uuid.uuid4().hex[:8]
    email = f"test-scope-{test_id}@mlblock-test.io"
    password = f"TestPass-{test_id}!"
    user_info = None

    try:
        user_info = _signup_user(email, password)
        token = user_info["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a pipeline
        create_resp = real_auth_client.post(
            "/api/pipelines",
            json={"name": f"scope-test-{test_id}", "nodes": [], "edges": []},
            headers=headers,
        )
        assert create_resp.status_code == 201
        pipeline_id = create_resp.json()["id"]

        # List pipelines — should find the one we just created
        list_resp = real_auth_client.get("/api/pipelines", headers=headers)
        assert list_resp.status_code == 200
        pipelines = list_resp.json()["items"]
        assert any(p["id"] == pipeline_id for p in pipelines)

        # Delete it
        del_resp = real_auth_client.delete(
            f"/api/pipelines/{pipeline_id}", headers=headers
        )
        assert del_resp.status_code == 204
    finally:
        if user_info and user_info.get("user_id"):
            _delete_user(user_info["user_id"], SUPABASE_SERVICE_KEY)
