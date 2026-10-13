from __future__ import annotations

from mlblock import execution as ex


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
