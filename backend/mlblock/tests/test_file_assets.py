"""Circuit fichier : table FileAsset + helpers purs (Task 1)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool


def _memory_session() -> Session:
    from mlblock.server.models import FileAsset  # noqa: F401 -- enregistre la table
    from mlblock.server import models as _  # noqa: F401

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def _asset(owner: uuid.UUID, size: int, status: str, expired: bool = False) -> "object":
    from mlblock.server.models import FileAsset

    now = datetime.now(timezone.utc)
    return FileAsset(
        owner_id=owner,
        name="f.csv",
        storage_path=f"{owner}/x.csv",
        size_bytes=size,
        status=status,
        expires_at=now - timedelta(days=1) if expired else now + timedelta(days=30),
    )


def test_sniff_kind_detects_csv_image_text_model_audio():
    from mlblock.server.file_assets import sniff_kind

    assert sniff_kind(b"a,b,c\n1,2,3\n", "data.csv") == "csv"
    assert sniff_kind(b"col1;col2\n", "data.csv") == "csv"
    assert sniff_kind(b"\x89PNG\r\n\x1a\n....", "img.png") == "image"
    assert sniff_kind(b"\xff\xd8\xff\xe0....", "img.jpg") == "image"
    assert sniff_kind(b"PK\x03\x04....", "w.pt") == "model"
    assert sniff_kind(b"RIFF....WAVE", "s.wav") == "audio"
    assert sniff_kind(b"bonjour le monde\n", "notes.txt") == "text"


def test_sniff_kind_rejects_exe_renamed_as_csv():
    from mlblock.server.file_assets import sniff_kind

    assert sniff_kind(b"MZ\x90\x00....", "data.csv") == "other"


def test_build_storage_path_is_unique_per_asset():
    from mlblock.server.file_assets import build_storage_path

    owner = uuid.uuid4()
    p1 = build_storage_path(owner, uuid.uuid4(), "mon Dataset.CSV")
    p2 = build_storage_path(owner, uuid.uuid4(), "mon Dataset.CSV")
    assert p1 != p2
    assert p1.startswith(f"{owner}/")
    assert p1.endswith(".csv")


def test_quota_used_sums_ready_and_pending_not_expired():
    from mlblock.server.file_assets import quota_used

    owner = uuid.uuid4()
    with _memory_session() as s:
        s.add(_asset(owner, 10, "ready"))
        s.add(_asset(owner, 20, "ready"))
        s.add(_asset(owner, 5, "pending"))
        s.add(_asset(owner, 100, "ready", expired=True))
        s.add(_asset(uuid.uuid4(), 1000, "ready"))
        s.commit()
        assert quota_used(s, owner) == 35


def test_public_url_shape():
    from mlblock.server.file_assets import public_url

    url = public_url("user-uploads", "uid/a.csv")
    assert url.startswith("https://")
    assert url.endswith("/storage/v1/object/public/user-uploads/uid/a.csv")


# ── Task 2 : endpoints (client local SQLite, storage mocké) ──


class _FakeResp:
    def __init__(self, status=200, payload=None, content=b"", headers=None):
        self.status_code = status
        self._payload = payload
        self.content = content
        self.text = content.decode("utf-8", errors="replace")
        self.headers = headers or {}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def iter_content(self, chunk_size=8192):
        yield self.content[:chunk_size]


def _local_client(monkeypatch, storage_content: bytes = b"a,b\n1,2\n"):
    """TestClient + SQLite mémoire + user fixe + storage HTTP mocké."""
    from mlblock.server.auth import get_current_user
    from mlblock.server.database import get_session
    from mlblock.server.main import app

    user_id = "11111111-1111-1111-1111-111111111111"
    monkeypatch.setenv("SUPABASE_URL", "https://xyz.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "secret-test")
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)

    def override_session():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = lambda: user_id

    def fake_post(url, **kw):
        if "/upload/sign/" in url:
            return _FakeResp(200, {"signedUrl": "/sign/e/abc", "path": "p", "token": "t"})
        raise AssertionError(f"POST inattendu: {url}")

    def fake_get(url, **kw):
        fake_get.calls.append(kw)
        return _FakeResp(200, None, storage_content)

    fake_get.calls = []

    def fake_delete(url, **kw):
        fake_delete.called.append(url)
        return _FakeResp(200, None)

    fake_delete.called = []
    monkeypatch.setattr("mlblock.server.file_assets.requests.post", fake_post)
    monkeypatch.setattr("mlblock.server.routes.requests.get", fake_get)
    monkeypatch.setattr("mlblock.server.routes.requests.delete", fake_delete)
    c = TestClient(app)
    c.fake_delete_called = fake_delete.called
    yield_fixture = (c, engine, user_id)
    try:
        yield yield_fixture
    finally:
        app.dependency_overrides.clear()
        c.close()


@pytest.fixture()
def fclient(monkeypatch):
    yield from _local_client(monkeypatch)


def _upload(fclient, name="d.csv", size=100, mime="text/csv", block_type=None):
    c, _, _ = fclient
    body = {"name": name, "size_bytes": size, "mime": mime}
    if block_type:
        body["block_type"] = block_type
    return c.post("/api/files/request-upload", json=body)


def test_request_upload_returns_signed_url_and_pending(fclient):
    r = _upload(fclient)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["signed_url"].startswith("https://")
    assert "expires_at" in data
    from mlblock.server.models import FileAsset

    _, engine, _ = fclient
    with Session(engine) as s:
        row = s.exec(select(FileAsset).where(FileAsset.id == UUID(data["id"]))).one()
        assert row.status == "pending" and row.size_bytes == 100


def test_request_upload_refuses_over_quota(fclient, monkeypatch):
    monkeypatch.setenv("FILE_QUOTA_BYTES", "150")
    assert _upload(fclient, size=100).status_code == 201
    r = _upload(fclient, size=100)
    assert r.status_code == 413
    assert "Espace" in r.json()["detail"] or "espace" in r.json()["detail"].lower()


def test_confirm_refuses_larger_than_declared(fclient):
    r = _upload(fclient, size=10)
    asset_id = r.json()["id"]
    c, _, _ = fclient
    r2 = c.post(f"/api/files/{asset_id}/confirm")
    assert r2.status_code == 413, r2.text


def test_confirm_refuses_renamed_exe_as_csv(fclient, monkeypatch):
    monkeypatch.setattr(
        "mlblock.server.routes.requests.get",
        lambda url, **kw: _FakeResp(200, None, b"MZ\x90\x00...."),
    )
    r = _upload(fclient, name="data.csv", size=8)
    c, _, _ = fclient
    r2 = c.post(f"/api/files/{r.json()['id']}/confirm")
    assert r2.status_code == 415, r2.text


def test_confirm_ok_returns_preview_and_public_url(fclient):
    r = _upload(fclient, name="d.csv", size=8)
    c, _, _ = fclient
    r2 = c.post(f"/api/files/{r.json()['id']}/confirm")
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["kind"] == "csv"
    assert data["public_url"].startswith("https://")
    assert data["preview"]["rows"] == [["a", "b"], ["1", "2"]]


def test_gallery_lists_ready_and_delete_frees(fclient):
    c, _, _ = fclient
    asset_id = _upload(fclient, size=8).json()["id"]
    assert c.get("/api/files").json() == []
    c.post(f"/api/files/{asset_id}/confirm")
    items = c.get("/api/files").json()
    assert len(items) == 1 and items[0]["id"] == asset_id
    assert c.delete(f"/api/files/{asset_id}").status_code == 204
    assert c.get("/api/files").json() == []
    assert len(c.fake_delete_called) == 1


# ── Task 3 : contrat accept via (format:) ──


def test_catalog_exposes_format_as_accept_for_loaders():
    from mlblock.catalog import catalog

    assert catalog.get("load_csv").params["path"].format == ".csv"
    assert catalog.get("load_text").params["path"].format == ".csv|.txt"
    assert catalog.get("load_image").params["path"].format == ".png|.jpg"


def test_request_upload_refuses_accept_mismatch(fclient):
    r = _upload(fclient, name="img.png", size=100, mime="image/png", block_type="load_csv")
    assert r.status_code == 415, r.text
    assert "n'accepte pas" in r.json()["detail"]


def test_loaders_raise_french_error_on_missing_file(monkeypatch):
    import importlib.util
    from pathlib import Path

    import pytest

    base = Path("mlblock/blocks/donnees-22C55E")

    def load(mod: str, fn: str):
        spec = importlib.util.spec_from_file_location(f"probe_{fn}", base / mod)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        return getattr(m, fn)

    with pytest.raises(Exception, match="réimporte"):
        load("load_csv.py", "load_csv")("https://xyz.supabase.co/storage/v1/object/public/x/nope.csv")

    class _Boom:
        def raise_for_status(self):
            raise RuntimeError("404")

    monkeypatch.setattr("requests.get", lambda url, **kw: _Boom())
    with pytest.raises(Exception, match="réimporte"):
        load("load_image.py", "load_image")("https://xyz.supabase.co/storage/v1/object/public/x/nope.png")


def test_sign_upload_url_prefixes_relative_rest_url(monkeypatch):
    """La REST Storage renvoie {"url": "/object/upload/sign/..?token=.."} (relatif)."""
    from mlblock.server import file_assets

    monkeypatch.setenv("SUPABASE_URL", "https://xyz.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "secret-test")

    class _Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return {"url": "/object/upload/sign/user-uploads/u/f.csv?token=abc"}

    monkeypatch.setattr(file_assets.requests, "post", lambda url, **kw: _Resp())
    signed = file_assets.sign_upload_url("user-uploads", "u/f.csv")
    assert signed == "https://xyz.supabase.co/storage/v1/object/upload/sign/user-uploads/u/f.csv?token=abc"


# ── Fix pass revue finale ──


def test_confirm_size_mismatch_expires_and_deletes_object(fclient):
    from mlblock.server.models import FileAsset
    from sqlmodel import select

    c, engine, _ = fclient
    asset_id = _upload(fclient, size=10).json()["id"]
    r = c.post(f"/api/files/{asset_id}/confirm")
    assert r.status_code == 413
    assert len(c.fake_delete_called) == 1
    assert "user-uploads" in c.fake_delete_called[0]
    with Session(engine) as s:
        row = s.exec(select(FileAsset).where(FileAsset.id == UUID(asset_id))).one()
        assert row.status == "expired"


def test_confirm_exe_as_csv_expires_and_deletes_object(fclient, monkeypatch):
    from mlblock.server.models import FileAsset
    from sqlmodel import select

    monkeypatch.setattr(
        "mlblock.server.routes.requests.get",
        lambda url, **kw: _FakeResp(200, None, b"MZ\x90\x00...."),
    )
    c, engine, _ = fclient
    asset_id = _upload(fclient, name="data.csv", size=8).json()["id"]
    r = c.post(f"/api/files/{asset_id}/confirm")
    assert r.status_code == 415
    assert len(c.fake_delete_called) == 1
    with Session(engine) as s:
        row = s.exec(select(FileAsset).where(FileAsset.id == UUID(asset_id))).one()
        assert row.status == "expired"


def test_delete_pending_asset_removes_object(fclient):
    c, _, _ = fclient
    asset_id = _upload(fclient).json()["id"]
    assert c.delete(f"/api/files/{asset_id}").status_code == 204
    assert len(c.fake_delete_called) == 1


def test_cleanup_expired_removes_rows_and_objects(fclient):
    from datetime import datetime, timedelta, timezone

    from mlblock.server.models import FileAsset
    from mlblock.server.routes import cleanup_expired_files
    from sqlmodel import select

    c, engine, user_id = fclient
    with Session(engine) as s:
        s.add(
            FileAsset(
                owner_id=UUID(user_id),
                name="vieux.csv",
                storage_path="x/vieux.csv",
                status="pending",
                expires_at=datetime.now(timezone.utc) - timedelta(days=1),
            )
        )
        s.commit()
        assert cleanup_expired_files(s) == 1
        assert s.exec(select(FileAsset)).all() == []
    assert len(c.fake_delete_called) == 1


def test_request_upload_rejects_malformed_body(fclient):
    c, _, _ = fclient
    assert c.post("/api/files/request-upload", json={}).status_code == 400
    assert c.post("/api/files/request-upload", json={"name": "x", "size_bytes": "beaucoup"}).status_code == 400


def test_confirm_refuses_quota_filled_since_request(fclient, monkeypatch):
    c, _, _ = fclient
    monkeypatch.setenv("FILE_QUOTA_BYTES", "20")
    a = _upload(fclient, size=8).json()["id"]
    b = _upload(fclient, size=8).json()["id"]
    assert c.post(f"/api/files/{a}/confirm").status_code == 200
    monkeypatch.setenv("FILE_QUOTA_BYTES", "10")
    r = c.post(f"/api/files/{b}/confirm")
    assert r.status_code == 413
    assert "Espace plein" in r.json()["detail"]


def test_confirm_reads_head_only_with_range_and_stream(fclient, monkeypatch):
    seen = {}

    def fake_get(url, **kw):
        seen.update(kw)
        return _FakeResp(200, None, b"a,b\n1,2\n")

    monkeypatch.setattr("mlblock.server.routes.requests.get", fake_get)
    c, _, _ = fclient
    asset_id = _upload(fclient, name="d.csv", size=8).json()["id"]
    assert c.post(f"/api/files/{asset_id}/confirm").status_code == 200
    assert seen.get("stream") is True
    assert "Range" in seen.get("headers", {})


def test_columns_uses_range_header(fclient, monkeypatch):
    seen = {}

    def fake_get(url, **kw):
        seen.update(kw)
        return _FakeResp(200, None, b"a,b,c\n1,2,3\n")

    monkeypatch.setattr("mlblock.server.routes.requests.get", fake_get)
    c, _, _ = fclient
    r = c.get(
        "/api/files/columns", params={"url": "https://xyz.supabase.co/storage/v1/object/public/user-uploads/u/d.csv"}
    )
    assert r.status_code == 200, r.text
    assert r.json() == {"columns": ["a", "b", "c"]}
    assert "Range" in seen.get("headers", {})


def test_load_image_corrupt_bytes_raise_french(monkeypatch):
    import importlib.util
    from pathlib import Path

    import pytest

    spec = importlib.util.spec_from_file_location(
        "probe_load_image", Path("mlblock/blocks/donnees-22C55E/load_image.py")
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    class _Ok:
        content = b"pas une image"

        def raise_for_status(self):
            pass

    monkeypatch.setattr("requests.get", lambda url, **kw: _Ok())
    with pytest.raises(Exception, match="réimporte"):
        mod.load_image("https://x/i.png")
