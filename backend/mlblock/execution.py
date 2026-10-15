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

# ── GPU image policy (single owner; see stages.needs_cuda) ──────────
IMAGE_SLIM = "ghcr.io/astral-sh/uv:python3.12-trixie-slim"
IMAGE_CUDA = "vastai/pytorch:2.6.0-cuda-12.6.3-py312"
DISK_SLIM = 20
DISK_CUDA = 50
TEMPLATE_CUDA_HASH = os.environ.get("VAST_TEMPLATE_CUDA", "b12fc2b5f6c711d715a5e4714b246818")
REQUIREMENTS_BASE = "scikit-learn gymnasium pandas requests xgboost mlflow"
REQUIREMENTS_TORCH = "torch torchvision"
REQUIREMENTS_SLIM = REQUIREMENTS_BASE
REQUIREMENTS_CUDA = f"{REQUIREMENTS_BASE} torchvision"


def image_for(cuda: bool) -> str:
    return IMAGE_CUDA if cuda else IMAGE_SLIM


def disk_for(cuda: bool) -> int:
    return DISK_CUDA if cuda else DISK_SLIM


def gpu_for(cuda: bool) -> str | None:
    """Modèle GPU demandé : 3090 si CUDA, None = offre vérifiée la moins chère."""
    return "RTX 3090" if cuda else None


def template_for(cuda: bool) -> str | None:
    """Hash du template d'équipe (image + env pinnés) : chemin CUDA uniquement."""
    return TEMPLATE_CUDA_HASH if cuda else None


def label_for(job_id: UUID | str) -> str:
    return f"mlblock-{job_id}"


def requirements_for(cuda: bool) -> str:
    return REQUIREMENTS_CUDA if cuda else REQUIREMENTS_SLIM


def build_bootstrap(*, backend_url: str, job_id: str, gpu_key: str, timeout: str, cuda: bool) -> str:
    """Tiny onstart script (< 4 KB) : reports progress, installs deps via uv, fetches code, runs it.

    Fails loud : code fetch failure posts job error and exits non-zero.
    """
    reqs = REQUIREMENTS_BASE
    lines = [
        f"export BACKEND_URL='{backend_url}' GPU_API_KEY='{gpu_key}' JOB_ID='{job_id}' BACKEND_TIMEOUT='{timeout}'",
        'KEY="${CONTAINER_API_KEY:-$GPU_API_KEY}"',
        # python:slim embarque uv mais pas curl — filet apt (Vast tourne root, Debian).
        # `timeout` partout : une egress morte ne doit jamais bloquer le run
        # jusqu'au timer GPU — échec rapide, callbacks d'erreur, retry sur un
        # autre hôte.
        "command -v curl >/dev/null 2>&1 || timeout 240 sh -c 'apt-get update -qq && apt-get install -y -qq curl'",
        'post() { curl -sS -m 20 -X POST -H "Authorization: Bearer $KEY"'
        " -H 'Content-Type: application/json'"
        ' -d "$2" "$BACKEND_URL/api/jobs/$JOB_ID/$1" || true; }',
        # Texte libre (stderr, version torch) -> JSON sûr : sans " \ ni sauts de ligne.
        "clean() { tr -d '\"\\\\' | tr '\\n\\r\\t' '   ' | head -c 300; }",
        'post status \'{"block":"bootstrap","status":"running"}\'',
        "command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh",
        'export PATH="$HOME/.local/bin:$PATH"',
        # Deps déjà présentes (image bakée / cache) : skip, sinon 3 min perdues.
        f"python3 -c 'import sklearn, gymnasium, pandas, requests, xgboost, mlflow' 2>/dev/null || "
        f"{{ timeout 600 uv pip install --system -q {reqs} "
        f"|| timeout 600 pip install -q --disable-pip-version-check {reqs}; }}",
    ]
    if cuda:
        # Le template CUDA embarque déjà torch : n'installer le bundle torch
        # que s'il manque (un torch pip par-dessus le torch du template =
        # clash ABI et segfault à l'import, aucun callback possible).
        lines.append(
            f"python3 -c 'import torch' 2>/dev/null || "
            f"{{ timeout 600 uv pip install --system -q {REQUIREMENTS_TORCH} "
            f"|| timeout 600 pip install -q --disable-pip-version-check {REQUIREMENTS_TORCH}; }}"
        )
        lines.append(
            'TV=$(python3 -c "import torch; print(torch.__version__, torch.cuda.is_available())" 2>&1 | clean)'
        )
        lines.append('post output "{\\"block\\":\\"bootstrap\\",\\"output\\":\\"Torch $TV\\"}"')
    lines.extend(
        [
            'post output \'{"block":"bootstrap","output":"Environnement installé"}\'',
            'curl -sSf --retry 8 --retry-all-errors --retry-delay 10 -H "Authorization: Bearer $KEY"'
            ' "$BACKEND_URL/api/jobs/$JOB_ID/code" -o main.py'
            ' || { post error \'{"block":"bootstrap","error":"Code non récupéré"}\'; exit 1; }',
            'post output \'{"block":"bootstrap","output":"Code récupéré"}\'',
            # Crash avant le try de main() (segfault import, etc.) : sans ça,
            # aucun callback et le job attend le timeout GPU complet.
            "python3 main.py 2>err.log; RC=$?; cat err.log >&2",
            '[ $RC -eq 0 ] || post error'
            ' "{\\"block\\":\\"bootstrap\\",\\"error\\":\\"main.py rc=$RC: $(tail -c 300 err.log | clean)\\"}"',
            "exit $RC",
        ]
    )
    return "\n".join(lines)


class ExecutionBackend(Protocol):
    def launch(self, code: str, job_id: UUID, *, cuda: bool = False) -> dict: ...
    def destroy(self, instance_id: str) -> None: ...


class LocalBackend:
    _processes: dict[UUID, subprocess.Popen] = {}

    def launch(self, code: str, job_id: UUID, *, cuda: bool = False) -> dict:
        fd, path = tempfile.mkstemp(suffix=".py", prefix="mlblock_run_")
        with os.fdopen(fd, "w") as f:
            f.write(code)
        env = dict(os.environ)
        env.update({
            "BACKEND_URL": os.environ.get("BACKEND_URL", "http://localhost:8000"),
            "JOB_ID": str(job_id),
            "GPU_API_KEY": os.environ.get("GPU_API_KEY", "mock-gpu-key"),
            "BACKEND_TIMEOUT": os.environ.get("BACKEND_TIMEOUT", "90"),
        })
        proc = subprocess.Popen([sys.executable, path], env=env, start_new_session=True)
        self._processes[job_id] = proc
        return {"id": "local-instance-id", "api_key": ""}

    def cancel(self, job_id: UUID) -> None:
        proc = self._processes.pop(job_id, None)
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=1)
            except subprocess.TimeoutExpired:
                proc.kill()
            except Exception:
                pass

    def destroy(self, instance_id: str) -> None:
        return None

class VastBackend:
    def __init__(self, api_key: str | None = None) -> None:
        from mlblock.core.vast import VastAI

        self._vast = VastAI(api_key=api_key or os.environ.get("VAST_API_KEY", "mock-vast-key"))

    def launch(self, code: str, job_id: UUID, *, cuda: bool = False) -> dict:
        # Le code est récupéré au boot via GET /api/jobs/{id}/code : l'onstart
        # reste un bootstrap < 4 Ko (limite Vast 16 Ko), jamais le main.py entier.
        onstart = build_bootstrap(
            backend_url=os.environ.get("BACKEND_URL", "http://localhost:8000"),
            job_id=str(job_id),
            gpu_key=os.environ.get("GPU_API_KEY", ""),
            timeout=os.environ.get("BACKEND_TIMEOUT", "90"),
            cuda=cuda,
        )
        template_hash_id = template_for(cuda)
        offer_note = {"gpu": gpu_for(cuda) or "cheapest", "image": None if template_hash_id else image_for(cuda)}
        print(f"VastBackend.launch job={job_id} cuda={cuda} {offer_note}")
        instance = self._vast.launch_instance(  # noqa: E501
            gpu_name=gpu_for(cuda),
            num_gpus=1,
            image=None if template_hash_id else image_for(cuda),
            disk=disk_for(cuda),
            onstart=onstart,
            template_hash_id=template_hash_id,
            label=label_for(job_id),
        )
        return instance

    def destroy(self, instance_id: str) -> None:
        if instance_id in ("local-instance-id", "mock-instance-id"):
            return
        try:
            self._vast.destroy_instance(instance_id)
        except Exception:
            pass

    def list_instances(self) -> list:
        return self._vast.list_instances()

    def start(self, instance_id: str) -> None:
        try:
            self._vast.start_instance(instance_id)
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
