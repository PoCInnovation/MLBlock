from __future__ import annotations

import os as _os
from datetime import datetime as _dt
from datetime import timedelta as _td
from datetime import timezone as _tz
from uuid import UUID as _UUID

from sqlmodel import Session as _Session
from sqlmodel import create_engine as _create_engine
from sqlmodel.pool import StaticPool as _StaticPool

from mlblock import execution as ex
from mlblock.core.vast import VastAI
from mlblock.execution import TEMPLATE_CUDA_HASH, gpu_for, label_for, template_for
from mlblock.server.models import Job as _Job


class _OkOffers:
    def __init__(self, offers):
        self._offers = offers

    def raise_for_status(self):
        return None

    def json(self):
        return {"offers": self._offers}


class _OkContract:
    def __init__(self, new_contract):
        self._id = new_contract

    def raise_for_status(self):
        return None

    def json(self):
        return {"new_contract": self._id, "instance_api_key": "k"}


def test_image_and_disk_selection():
    assert ex.image_for(False) == ex.IMAGE_SLIM
    assert ex.image_for(True) == ex.IMAGE_CUDA
    assert ex.disk_for(False) == 20
    assert ex.disk_for(True) == 50


def test_build_bootstrap_slim_contains_code_endpoint_and_uv():
    s = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=False)
    assert "/api/jobs/$JOB_ID/code" in s
    assert "uv pip install --system" in s
    assert "torchvision" not in s
    assert 'post status \'{"block":"bootstrap","status":"running"}\'' in s
    assert s.count("post output") == 2
    assert "exit 1" in s
    assert "command -v curl" in s and "apt-get install" in s
    assert len(s) < 4048


def test_build_bootstrap_cuda_keeps_torchvision():
    s = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=True)
    assert "torchvision" in s
    assert "${CONTAINER_API_KEY:-$GPU_API_KEY}" in s


def test_gpu_for_cuda_returns_rtx3090_and_template():
    assert gpu_for(True) == "RTX 3090"
    assert template_for(True) == TEMPLATE_CUDA_HASH


def test_gpu_for_slim_returns_none_and_no_template():
    assert gpu_for(False) is None
    assert template_for(False) is None


def test_label_for_is_unique_per_job():
    assert label_for("aaa") == "mlblock-aaa"
    assert label_for("aaa") != label_for("bbb")


def test_search_offers_without_gpu_name_omits_filter(monkeypatch):
    seen = {}
    monkeypatch.setattr(
        "mlblock.core.vast.requests.post",
        lambda url, **kw: seen.update(json=kw["json"]) or _OkOffers([]),
    )
    VastAI(api_key="real-key").search_offers(None)
    assert "gpu_name" not in seen["json"]
    assert seen["json"]["num_gpus"] == {"eq": 1}


def test_launch_instance_sends_template_and_label(monkeypatch):
    seen = {}
    monkeypatch.setattr(
        "mlblock.core.vast.VastAI.search_offers", lambda s, g, n=1, limit=5: [{"id": 7}]
    )
    monkeypatch.setattr(
        "mlblock.core.vast.requests.put",
        lambda url, **kw: seen.update(json=kw["json"]) or _OkContract(42),
    )
    out = VastAI(api_key="real-key").launch_instance(None, 1, None, 20, template_hash_id="h", label="mlblock-j")
    assert seen["json"]["template_hash_id"] == "h"
    assert seen["json"]["label"] == "mlblock-j"
    assert "image" not in seen["json"]
    assert out["id"] == "42"


class _OkInstances:
    def __init__(self, instances, next_token):
        self._instances = instances
        self._next = next_token

    def raise_for_status(self):
        return None

    def json(self):
        return {"instances": self._instances, "next_token": self._next}


def test_list_instances_sends_v1_select_and_filter(monkeypatch):
    seen = {}
    monkeypatch.setattr(
        "mlblock.core.vast.requests.get",
        lambda url, **kw: seen.update(url=url, params=kw["params"])
        or _OkInstances([{"id": 1, "label": "mlblock-a", "actual_status": "running"}], None),
    )
    out = VastAI(api_key="real-key").list_instances("running")
    assert "/api/v1/instances" in seen["url"]
    assert "id" in seen["params"]["select_cols"]
    assert out == [{"id": 1, "label": "mlblock-a", "actual_status": "running"}]


def test_list_instances_follows_next_token(monkeypatch):
    pages = [_OkInstances([{"id": 1}], "tok"), _OkInstances([{"id": 2}], None)]
    monkeypatch.setattr("mlblock.core.vast.requests.get", lambda url, **kw: pages.pop(0))
    assert [i["id"] for i in VastAI(api_key="real-key").list_instances()] == [1, 2]


def test_list_instances_mock_key_no_http(monkeypatch):
    def _boom(*a, **kw):
        raise AssertionError("no HTTP on mock key")

    monkeypatch.setattr("mlblock.core.vast.requests.get", _boom)
    assert VastAI(api_key="mock-vast-key").list_instances() == []


# ── Task 3: reaper ──────────────────────────────────────────────
class _FakeBackend:
    instances = []
    destroyed = []

    def list_instances(self):
        return list(type(self).instances)

    def destroy(self, instance_id):
        type(self).destroyed.append(instance_id)


def _reap_engine():
    url = _os.environ.get("DATABASE_URL")
    if not url:
        import pytest as _pytest

        _pytest.skip("DATABASE_URL not set")
    return _create_engine(url, poolclass=_StaticPool)


def _reap_setup(client, monkeypatch, instances, status="dispatched", age_s=0, instance_id="4242"):
    """Crée un job via l'API, le maquille en job GPU réel, installe les fakes."""
    _FakeBackend.instances = list(instances)
    _FakeBackend.destroyed = []
    monkeypatch.setattr("mlblock.reap.VastBackend", _FakeBackend)
    cleaned = []
    monkeypatch.setattr("mlblock.reap.cleanup_pipeline_files", lambda pid: cleaned.append(pid))
    created = client.post("/api/pipelines", json={"name": "reap", "nodes": [], "edges": []}).json()
    job = client.post(f"/api/pipelines/{created['id']}/execute").json()
    jid = job["id"]
    engine = _reap_engine()
    with _Session(engine) as s:
        row = s.get(_Job, _UUID(jid))
        row.status = status
        row.vast_instance_id = instance_id
        row.created_at = _dt.now(_tz.utc) - _td(seconds=age_s)
        s.add(row)
        s.commit()
    return jid, _FakeBackend, cleaned


def _reap_job(jid):
    with _Session(_reap_engine()) as s:
        row = s.get(_Job, _UUID(jid))
        s.expunge(row)
        return row


def test_reap_destroys_running_instance_of_terminal_job(client, monkeypatch):
    from mlblock.reap import main

    jid, fake, _ = _reap_setup(client, monkeypatch, [], status="done")
    fake.instances = [{"id": 4242, "label": f"mlblock-{jid}", "actual_status": "running"}]
    n = main()
    assert n == 1
    assert fake.destroyed == [4242]


def test_reap_marks_timed_out_job_error_and_destroys(client, monkeypatch):
    from mlblock.reap import main

    jid, fake, cleaned = _reap_setup(client, monkeypatch, [], status="dispatched", age_s=3600)
    fake.instances = [{"id": 4242, "label": f"mlblock-{jid}", "actual_status": "running"}]
    n = main()
    row = _reap_job(jid)
    assert n == 1
    assert row.status == "error"
    assert "GPU TIMEOUT" in row.error
    assert row.completed_at is not None
    assert len(cleaned) == 1


def test_reap_marks_exited_instance_error_poll_trap(client, monkeypatch):
    from mlblock.reap import main

    jid, fake, _ = _reap_setup(client, monkeypatch, [], status="running", age_s=700)
    fake.instances = [{"id": 4242, "label": f"mlblock-{jid}", "actual_status": "exited"}]
    n = main()
    row = _reap_job(jid)
    assert n == 1
    assert row.status == "error"
    assert "exited" in row.error


def test_reap_destroys_labelled_instance_without_job(client, monkeypatch):
    from mlblock.reap import main

    _FakeBackend.instances = [{"id": 777, "label": "mlblock-00000000-0000-0000-0000-000000000000",
                               "actual_status": "running"}]
    _FakeBackend.destroyed = []
    monkeypatch.setattr("mlblock.reap.VastBackend", _FakeBackend)
    monkeypatch.setattr("mlblock.reap.cleanup_pipeline_files", lambda pid: None)
    n = main()
    assert n == 1
    assert _FakeBackend.destroyed == [777]


def test_reap_spares_freshly_dispatched_job_in_grace(client, monkeypatch):
    from mlblock.reap import main

    jid, fake, _ = _reap_setup(client, monkeypatch, [], status="dispatched", age_s=60)
    fake.instances = [{"id": 4242, "label": f"mlblock-{jid}", "actual_status": "running"}]
    n = main()
    row = _reap_job(jid)
    assert n == 0
    assert fake.destroyed == []
    assert row.status == "dispatched"


def test_vast_backend_list_instances_passthrough():
    from mlblock.execution import VastBackend

    assert VastBackend(api_key="mock-x").list_instances() == []
