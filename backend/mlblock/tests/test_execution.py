from __future__ import annotations

from mlblock import execution as ex
from mlblock.core.vast import VastAI
from mlblock.execution import TEMPLATE_CUDA_HASH, gpu_for, label_for, template_for


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
