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

def test_search_offers_template_path_requires_cuda_13_host(monkeypatch):
    """Le torch cu130 du template ne démarre pas sur un hôte CUDA 12.x : le
    filtre doit l'exclure (offres 12.2/12.8 observées au prix le plus bas)."""
    seen = {}
    monkeypatch.setattr(
        "mlblock.core.vast.requests.post",
        lambda url, **kw: seen.update(json=kw["json"]) or _OkOffers([]),
    )
    VastAI(api_key="real-key").search_offers("RTX 3090")
    assert seen["json"]["cuda_max_good"] == {"gte": 13.0}
    VastAI(api_key="real-key").search_offers(None)
    assert "cuda_max_good" not in seen["json"]


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


def test_reap_ignores_foreign_instances_without_mlblock_label(client, monkeypatch):
    from mlblock.reap import main

    _FakeBackend.instances = [
        {"id": 99, "label": "my-server", "actual_status": "running"},
        {"id": 100, "label": None, "actual_status": "running"},
    ]
    _FakeBackend.destroyed = []
    monkeypatch.setattr("mlblock.reap.VastBackend", _FakeBackend)
    monkeypatch.setattr("mlblock.reap.cleanup_pipeline_files", lambda pid: None)
    assert main() == 0
    assert _FakeBackend.destroyed == []


def test_list_instances_raises_on_total_failure(monkeypatch):
    import pytest as _pytest

    def _boom(url, **kw):
        raise ConnectionError("vast down")

    monkeypatch.setattr("mlblock.core.vast.requests.get", _boom)
    with _pytest.raises(ConnectionError):
        VastAI(api_key="real-key").list_instances()


def test_reap_aborts_when_inventory_fails(client, monkeypatch):
    from mlblock.reap import main

    jid, fake, _ = _reap_setup(client, monkeypatch, [], status="dispatched", age_s=3600)

    class _Down(_FakeBackend):
        def list_instances(self):
            raise ConnectionError("vast down")

    monkeypatch.setattr("mlblock.reap.VastBackend", _Down)
    assert main() == 0
    assert _reap_job(jid).status == "dispatched"


def test_launch_instance_returns_error_detail(monkeypatch):
    monkeypatch.setattr("mlblock.core.vast.VastAI.search_offers", lambda s, g, n=1, limit=5: [])
    out = VastAI(api_key="real-key").launch_instance("RTX 3090", 1, "img", 20)
    assert out["id"] == "dummy-instance-id"
    assert "RTX 3090" in out["error"]


def test_vast_backend_start_passthrough_mock():
    from mlblock.execution import VastBackend

    assert VastBackend(api_key="mock-x").start("123") is None


def test_launch_instance_logs_chosen_offer(monkeypatch, capsys):
    monkeypatch.setattr(
        "mlblock.core.vast.VastAI.search_offers",
        lambda s, g, n=1, limit=5: [{"id": 7, "gpu_name": "GTX 1070", "dph_total": 0.05}],
    )
    monkeypatch.setattr(
        "mlblock.core.vast.requests.put",
        lambda url, **kw: _OkContract(42),
    )
    VastAI(api_key="real-key").launch_instance(None, 1, "img", 20)
    out = capsys.readouterr().out
    assert "id=7" in out and "GTX 1070" in out and "0.05" in out


def test_build_bootstrap_cuda_conditions_torch_install_and_probes():
    s = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=True)
    assert "python3 -c 'import torch'" in s
    assert "torch torchvision" in s
    assert "Torch $TV" in s
    assert "timeout 600 uv pip install" in s
    assert len(s) < 4048
    slim = ex.build_bootstrap(backend_url="https://api.example", job_id="J1", gpu_key="K1", timeout="90", cuda=False)
    assert "import torch" not in slim
    assert "timeout 240 sh -c 'apt-get" in slim


def test_bootstrap_reports_main_crash_as_valid_json_error(tmp_path):
    """main.py qui plante avant son try (ex. segfault import torch) : le job
    doit recevoir une erreur JSON valide avec la cause, pas 1800 s de silence."""
    import json
    import subprocess

    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log = tmp_path / "posts.log"
    crash = "import sys; sys.stderr.write('boom \"quoted\"\\\\path\\n'); sys.exit(3)"
    (bin_dir / "curl").write_text(
        "#!/bin/sh\n"
        f'case "$*" in *"-o main.py"*) printf "%s" "{crash}" > main.py ;; '
        f'*) while [ $# -gt 0 ]; do [ "$1" = -d ] && printf "%s\\n" "$2" >> {log}; shift; done ;; esac\n'
    )
    for name in ("uv", "pip"):
        (bin_dir / name).write_text("#!/bin/sh\nexit 0\n")
    for f in bin_dir.iterdir():
        f.chmod(0o755)
    script = ex.build_bootstrap(backend_url="http://b", job_id="J", gpu_key="K", timeout="9", cuda=False)
    env = {**_os.environ, "PATH": f"{bin_dir}:{_os.environ['PATH']}", "HOME": str(tmp_path)}
    rc = subprocess.run(["sh", "-c", script], cwd=tmp_path, env=env, capture_output=True).returncode
    assert rc == 3
    posts = [json.loads(line) for line in log.read_text().splitlines()]
    errors = [p["error"] for p in posts if "error" in p]
    assert errors and "rc=3" in errors[-1] and "boom" in errors[-1]


def test_bootstrap_install_failure_posts_error_and_stops(tmp_path):
    """uv qui échoue : erreur postée au job et arrêt immédiat (avant : « Environnement
    installé » annoncé à tort puis 10 min de pip jusqu'au timeout)."""
    import json
    import subprocess

    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log = tmp_path / "posts.log"
    (bin_dir / "curl").write_text(
        "#!/bin/sh\n"
        f'while [ $# -gt 0 ]; do [ "$1" = -d ] && printf "%s\\n" "$2" >> {log}; shift; done\n'
    )
    (bin_dir / "python3").write_text("#!/bin/sh\nexit 1\n")  # imports absents -> installation tentée
    (bin_dir / "uv").write_text("#!/bin/sh\nexit 1\n")
    for f in bin_dir.iterdir():
        f.chmod(0o755)
    script = ex.build_bootstrap(backend_url="http://b", job_id="J", gpu_key="K", timeout="9", cuda=False)
    env = {**_os.environ, "PATH": f"{bin_dir}:{_os.environ['PATH']}", "HOME": str(tmp_path)}
    rc = subprocess.run(["sh", "-c", script], cwd=tmp_path, env=env, capture_output=True).returncode
    assert rc == 1
    posts = [json.loads(line) for line in log.read_text().splitlines()]
    assert any("dépendances" in p.get("error", "") for p in posts)
    assert not any("Environnement installé" in p.get("output", "") for p in posts)


def test_launch_instance_retries_next_offer_on_ghost(monkeypatch):
    """Une offre fantôme (no_such_ask) ne doit pas tuer le rent : on essaie
    l'offre suivante au lieu de dummy-instance-id."""
    import json as _json
    import urllib.error as _urlerror

    calls = []

    def fake_put(url, **kw):
        calls.append(url)
        if url.endswith("/asks/11"):
            body = _json.dumps({"success": False, "error": "invalid_args",
                                "msg": "error 404/3603: no_such_ask not available."}).encode()
            raise _urlerror.HTTPError(url, 400, "Bad Request", {}, __import__("io").BytesIO(body))
        return _OkContract(22)

    monkeypatch.setattr(
        "mlblock.core.vast.VastAI.search_offers",
        lambda s, g, n=1, limit=5: [{"id": 11}, {"id": 22}],
    )
    monkeypatch.setattr("mlblock.core.vast.requests.put", fake_put)
    out = VastAI(api_key="real-key").launch_instance("RTX 3090", 1, None, 20, template_hash_id="h")
    assert out["id"] == "22"
    assert len(calls) == 2
