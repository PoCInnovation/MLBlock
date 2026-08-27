"""PipelineExecution — deep module (ExecutionBackend + StorageAdapter, orphan policy).

Adapters: LocalBackend (subprocess Popen) and VastBackend (REST) behind one seam.
Two adapters justify the seam (local in dev/tests, Vast in prod).
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile
import threading
from datetime import datetime, timezone
from typing import Protocol
from uuid import UUID

import requests

SUPABASE_STORAGE_URL = re.compile(r"^https://[^/]+/storage/v1/object/(?:public|authenticated)/([^/]+)/(.+)$")


class ExecutionBackend(Protocol):
    def launch(self, code: str, job_id: UUID) -> dict: ...
    def destroy(self, instance_id: str) -> None: ...


class LocalBackend:
    def launch(self, code: str, job_id: UUID) -> dict:
        fd, path = tempfile.mkstemp(suffix=".py", prefix="mlblock_run_")
        with os.fdopen(fd, "w") as f:
            f.write(code)
        env = dict(os.environ)
        env.update({
            "BACKEND_URL": "http://localhost:8000",
            "JOB_ID": str(job_id),
            "GPU_API_KEY": os.environ.get("GPU_API_KEY", "mock-gpu-key"),
            "BACKEND_TIMEOUT": os.environ.get("BACKEND_TIMEOUT", "90"),
        })
        subprocess.Popen([sys.executable, path], env=env, start_new_session=True)
        return {"id": "local-instance-id", "api_key": ""}

    def destroy(self, instance_id: str) -> None:
        return None


class VastBackend:
    def __init__(self, api_key: str | None = None) -> None:
        from mlblock.core.vast import VastAI

        self._vast = VastAI(api_key=api_key or os.environ.get("VAST_API_KEY", "mock-vast-key"))

    def launch(self, code: str, job_id: UUID) -> dict:
        env = {
            "BACKEND_URL": os.environ.get("BACKEND_URL", "http://localhost:8000"),
            "GPU_API_KEY": os.environ.get("GPU_API_KEY", ""),
            "JOB_ID": str(job_id),
            "BACKEND_TIMEOUT": os.environ.get("BACKEND_TIMEOUT", "90"),
        }
        env_str = " ".join(f"{k}='{v}'" for k, v in env.items())
        deps = "pip install -q --disable-pip-version-check scikit-learn gymnasium torchvision pandas requests"
        onstart = deps + " && " + env_str + " python - << 'MLBLOCK_EOF'\n" + code + "\nMLBLOCK_EOF"
        instance = self._vast.launch_instance(  # noqa: E501
            gpu_name="RTX 3090", num_gpus=1, image="pytorch/pytorch:latest", disk=50, onstart=onstart
        )
        return instance

    def destroy(self, instance_id: str) -> None:
        if instance_id in ("local-instance-id", "mock-instance-id"):
            return
        try:
            self._vast.destroy_instance(instance_id)
        except Exception:
            pass


def get_backend() -> ExecutionBackend:
    mode = os.environ.get("MLBLOCK_RUN_MODE", "local").lower()
    if mode == "gpu":
        return VastBackend()
    if mode == "local":
        return LocalBackend()
    key = os.environ.get("VAST_API_KEY", "mock-vast-key")
    if not key or key.startswith("mock"):
        return LocalBackend()
    return VastBackend()


# ── StorageAdapter (single owner for SUPABASE_STORAGE_URL) ─────────
def delete_file_from_storage(file_url: str) -> None:
    m = SUPABASE_STORAGE_URL.match(file_url)
    if not m:
        return
    bucket, path = m.group(1), m.group(2)
    secret = os.environ.get("SUPABASE_SECRET_KEY", "")
    if not secret:
        return
    project = os.environ.get("SUPABASE_URL", "").replace("https://", "").split(".")[0]
    if not project:
        return
    try:
        url = f"https://{project}.supabase.co/storage/v1/object/{bucket}/{path}"
        requests.delete(url, headers={"apikey": secret, "Authorization": f"Bearer {secret}"}, timeout=10)
    except Exception:
        pass


def cleanup_pipeline_files(pipeline_id: UUID) -> None:
    from mlblock.server.database import _get_engine
    from sqlmodel import Session as SqlSession
    from mlblock.server.models import Pipeline as PipelineTable

    with SqlSession(_get_engine()) as s:
        row = s.get(PipelineTable, pipeline_id)
        if not row or not row.nodes:
            return
        for node in row.nodes:
            params = node.get("params", {}) if isinstance(node, dict) else node.params
            if isinstance(params, dict):
                for val in params.values():
                    if isinstance(val, str) and SUPABASE_STORAGE_URL.match(val):
                        delete_file_from_storage(val)


def schedule_orphan_cleanup(job_id: UUID, instance_id: str, pipeline_id: UUID) -> None:
    """Single place for Timer + destroy + storage cleanup (locality)."""
    if not instance_id or instance_id in ("local-instance-id", "mock-instance-id"):
        return
    gpu_timeout = int(os.environ.get("MLBLOCK_GPU_TIMEOUT", "1800"))

    def _timeout_cleanup():
        from mlblock.server.database import _get_engine
        from sqlmodel import Session as SqlSession
        from mlblock.server.models import Job

        with SqlSession(_get_engine()) as s:
            j = s.get(Job, job_id)
            if j and j.status not in ("done", "error"):
                j.status = "error"
                j.error = f"GPU TIMEOUT: job did not complete within {gpu_timeout}s"
                j.completed_at = datetime.now(timezone.utc)
                s.add(j)
                s.commit()
                VastBackend().destroy(instance_id)
                cleanup_pipeline_files(pipeline_id)

    threading.Timer(gpu_timeout, _timeout_cleanup).start()
