from __future__ import annotations

import os
import re
import threading
from datetime import datetime, timezone
from uuid import UUID

import requests

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.vast import VastAI
from mlblock.core.graph import Graph
from mlblock.server.database import get_session
from mlblock.server.auth import get_current_user
from mlblock.server.gpu_auth import verify_gpu_key
from mlblock.server.models import Pipeline as PipelineTable, Job, JobOutput
from mlblock.server.schemas import (
    Page,
    PipelineCreate,
    PipelineDetail,
    PipelineEdge,
    PipelineNode,
    PipelineUpdate,
    JobStatusUpdate,
    JobOutputPush,
    JobErrorPush,
    ValidationRequest,
    ValidationResponse,
)
from mlblock.core.generator import generate_code

catalog_router = APIRouter(prefix="/api/catalog")
pipelines_router = APIRouter(prefix="/api/pipelines")
validation_router = APIRouter(prefix="/api/validate")
jobs_router = APIRouter(prefix="/api/jobs")
files_router = APIRouter(prefix="/api/files")
health_router = APIRouter()


@health_router.get("/health")
def health() -> dict:
    """Liveness probe — no DB access, cheap ping target."""
    mode = os.environ.get("MLBLOCK_RUN_MODE", "local").lower()
    return {"status": "ok", "run_mode": mode if mode in ("local", "gpu") else "local"}

SUPABASE_STORAGE_URL = re.compile(r"^https://[^/]+/storage/v1/object/(?:public|authenticated)/([^/]+)/(.+)$")


def _delete_file_from_storage(file_url: str) -> None:
    """Delete a file from Supabase Storage given its public URL."""
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


def _cleanup_pipeline_files(pipeline_id: UUID) -> None:
    """Find all file-type params in a pipeline and delete them from storage."""
    from mlblock.server.database import _get_engine
    from sqlmodel import Session as SqlSession
    with SqlSession(_get_engine()) as s:
        row = s.get(PipelineTable, pipeline_id)
        if not row or not row.nodes:
            return
        for node in row.nodes:
            params = node.get("params", {}) if isinstance(node, dict) else node.params
            if isinstance(params, dict):
                for val in params.values():
                    if isinstance(val, str) and SUPABASE_STORAGE_URL.match(val):
                        _delete_file_from_storage(val)


# ── Catalog ─────────────────────────────────────────────────────────

def _fr_label(block) -> str:
    """Label FR : première ligne de la docstring, sinon name.title()."""
    first = next((l.strip() for l in (block.description or "").splitlines() if l.strip()), "")
    first = first.rstrip(".")
    if len(first) >= 3 and not first.startswith(("Parameter", "Block", "Args")):
        return first
    return block.name.replace("_", " ").title()


def _fr_summary(block) -> str:
    """Description courte : 2e ligne de la docstring (après le label), sinon label."""
    lines = [l.strip() for l in (block.description or "").splitlines() if l.strip()]
    if len(lines) >= 2 and not lines[1].startswith(("Args", "Param")):
        return lines[1].rstrip(".")
    return _fr_label(block)


@catalog_router.get("")
def get_catalog() -> dict:
    categories: dict[str, dict] = {}
    for block in BLOCK_REGISTRY.values():
        cat = block.category.name
        if cat not in categories:
            categories[cat] = {
                "id": cat,
                "name": cat,
                "color": block.category.color,
                "blocks": [],
            }
        categories[cat]["blocks"].append({
            "type": block.name,
            "label": _fr_label(block),
            "description": _fr_summary(block),
            "params": {k: v.model_dump() for k, v in block.params.items()},
            "inputs": block.inputs,
            "outputs": block.outputs,
        })
    return {"categories": list(categories.values())}


# ── Files ───────────────────────────────────────────────────────────

@files_router.get("/columns")
def get_file_columns(url: str) -> dict:
    """Column names of a stored CSV (header line)."""
    import csv
    import io

    m = SUPABASE_STORAGE_URL.match(url)
    if not m:
        raise HTTPException(400, detail="URL de fichier invalide")
    bucket, path = m.group(1), m.group(2)
    secret = os.environ.get("SUPABASE_SECRET_KEY", "")
    project = os.environ.get("SUPABASE_URL", "").replace("https://", "").split(".")[0]
    if not secret or not project:
        raise HTTPException(400, detail="Stockage non configuré")
    try:
        r = requests.get(
            f"https://{project}.supabase.co/storage/v1/object/{bucket}/{path}",
            headers={"apikey": secret, "Authorization": f"Bearer {secret}"},
            timeout=10,
        )
        r.raise_for_status()
    except Exception:
        raise HTTPException(404, detail="Fichier introuvable")
    first_line = r.text.splitlines()[0] if r.text.strip() else ""
    columns = next(csv.reader(io.StringIO(first_line)), [])
    return {"columns": [c.strip() for c in columns if c.strip()]}


def _is_mock_vast() -> bool:
    """Mode d'exécution : MLBLOCK_RUN_MODE (défaut 'local' — le dev exécute
    réellement le pipeline en subprocess local). 'gpu' (Render, render.yaml)
    active le dispatch Vast.ai. Une clé mock/absente force toujours le local."""
    mode = os.environ.get("MLBLOCK_RUN_MODE", "local").lower()
    if mode == "gpu":
        return False
    if mode == "local":
        return True
    key = os.environ.get("VAST_API_KEY", "mock-vast-key")
    return not key or key.startswith("mock")


def _run_local(code: str, job_id: UUID) -> None:
    """Exécute le code généré en subprocess local (mode mock, sans GPU)."""
    import subprocess
    import sys
    import tempfile

    fd, path = tempfile.mkstemp(suffix=".py", prefix="mlblock_run_")
    with os.fdopen(fd, "w") as f:
        f.write(code)
    env = dict(os.environ)
    # Le subprocess doit joindre le serveur LOCAL (le BACKEND_URL du .env pointe
    # vers Render/prod — les callbacks du run local doivent revenir ici).
    env.update({
        "BACKEND_URL": "http://localhost:8000",
        "JOB_ID": str(job_id),
        "GPU_API_KEY": os.environ.get("GPU_API_KEY", "mock-gpu-key"),
        "BACKEND_TIMEOUT": os.environ.get("BACKEND_TIMEOUT", "90"),
    })
    subprocess.Popen([sys.executable, path], env=env, start_new_session=True)


# ── Pipelines ───────────────────────────────────────────────────────

def _row_to_summary(row: PipelineTable) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "is_draft": row.is_draft,
        "updated_at": row.updated_at.isoformat(),
    }


def _row_to_detail(row: PipelineTable, nodes, edges) -> PipelineDetail:
    node_schemas = [PipelineNode(**n) if isinstance(n, dict) else n for n in nodes]
    edge_schemas = [PipelineEdge(**e) if isinstance(e, dict) else e for e in edges]
    return PipelineDetail(
        id=row.id,
        name=row.name,
        description=row.description,
        is_draft=row.is_draft,
        nodes=node_schemas,
        edges=edge_schemas,
        code=row.code,
        created_at=row.created_at.isoformat(),
        updated_at=row.updated_at.isoformat(),
    )


@pipelines_router.get("")
def list_pipelines(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Page[dict]:
    query = select(PipelineTable).where(
        PipelineTable.user_id == UUID(user_id),
        PipelineTable.is_draft == False,  # noqa: E712
    )
    if search:
        query = query.where(PipelineTable.name.ilike(f"%{search}%"))
    query = query.order_by(PipelineTable.updated_at.desc())

    total = len(session.exec(query).all())
    rows = session.exec(query.offset((page - 1) * size).limit(size)).all()
    items = [_row_to_summary(r) for r in rows]
    return Page(items=items, total=total, page=page, size=size)


@pipelines_router.post("", status_code=201)
def create_pipeline(
    body: PipelineCreate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PipelineDetail:
    # Valide les types de blocs, arêtes et compatibilité de dtype (même gate
    # que /api/validate et /build) — protège l'import d'un JSON invalide.
    try:
        from mlblock.blocks.registry import BLOCK_REGISTRY
        from mlblock.models.pipeline import PipelineDef

        PipelineDef.model_validate(
            {"nodes": body.nodes, "edges": body.edges},
            context={"registry": BLOCK_REGISTRY},
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    # Enforce topological cycle check
    graph_data = {
        "nodes": [n.model_dump() for n in body.nodes],
        "edges": [e.model_dump() for e in body.edges],
    }
    graph = Graph(graph_data)  # raises ValueError on cycle

    user_uuid = UUID(user_id)

    if not body.is_draft:
        # Limite de 20 projets sauvegardés par utilisateur (les brouillons ne comptent pas)
        saved_count = len(
            session.exec(
                select(PipelineTable).where(
                    PipelineTable.user_id == user_uuid,
                    PipelineTable.is_draft == False,  # noqa: E712
                )
            ).all()
        )
        if saved_count >= 20:
            raise HTTPException(
                status_code=409,
                detail="Limite de 20 projets atteinte. Supprime un projet pour en créer un nouveau.",
            )
    else:
        # Un seul brouillon par utilisateur : on nettoie les précédents
        for old in session.exec(
            select(PipelineTable).where(
                PipelineTable.user_id == user_uuid,
                PipelineTable.is_draft == True,  # noqa: E712
            )
        ).all():
            session.delete(old)
        session.commit()

    row = PipelineTable(
        user_id=user_uuid,
        name=body.name,
        description=body.description,
        is_draft=body.is_draft,
        nodes=[n.model_dump() for n in body.nodes],
        edges=[e.model_dump() for e in body.edges],
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return _row_to_detail(row, body.nodes, body.edges)


@pipelines_router.get("/{pipeline_id}")
def get_pipeline(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    nodes = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]
    return _row_to_detail(row, nodes, edges)


@pipelines_router.put("/{pipeline_id}")
def update_pipeline(
    pipeline_id: UUID,
    body: PipelineUpdate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    if body.name is not None:
        row.name = body.name
    if body.description is not None:
        row.description = body.description
    if body.is_draft is not None:
        row.is_draft = body.is_draft
    if body.nodes is not None:
        row.nodes = [n.model_dump() for n in body.nodes]
    if body.edges is not None:
        row.edges = [e.model_dump() for e in body.edges]
    row.updated_at = datetime.now(timezone.utc)

    session.add(row)
    session.commit()
    session.refresh(row)

    nodes_schemas = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges_schemas = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]
    return _row_to_detail(row, nodes_schemas, edges_schemas)


@pipelines_router.delete("/{pipeline_id}", status_code=204)
def delete_pipeline(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    row = session.get(PipelineTable, pipeline_id)
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    # CASCADE: deleting pipeline auto-deletes its jobs and job_outputs
    session.delete(row)
    session.commit()


@pipelines_router.post("/{pipeline_id}/generate")
def generate_pipeline_code(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    row = session.get(PipelineTable, pipeline_id)
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    if not row.nodes:
        raise HTTPException(status_code=400, detail="Le pipeline ne contient aucun bloc")
    nodes = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]
    code = generate_code(nodes, edges)
    return {"code": code}


@pipelines_router.post("/{pipeline_id}/execute")
def execute_pipeline(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Job:
    row = session.get(PipelineTable, pipeline_id)
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Create job
    job = Job(
        user_id=UUID(user_id),
        pipeline_id=pipeline_id,
        status="queued",
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    # Generate code (avant la location : l'onstart l'embarque)
    nodes = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]
    code = generate_code(nodes, edges)
    row.code = code
    session.add(row)
    session.commit()

    if _is_mock_vast():
        # Mode local : exécute réellement le code en subprocess — les callbacks
        # (status/output/error) alimentent le job comme sur un vrai GPU.
        _run_local(code, job.id)
        job.vast_instance_id = "mock-instance-id"
        job.status = "dispatched"
        session.add(job)
        session.commit()
    else:
        # Le GPU doit joindre le backend pour les callbacks : BACKEND_URL
        # public (Render ou tunnel), GPU_API_KEY partagée, JOB_ID du job.
        env = {
            "BACKEND_URL": os.environ.get("BACKEND_URL", "http://localhost:8000"),
            "GPU_API_KEY": os.environ.get("GPU_API_KEY", ""),
            "JOB_ID": str(job.id),
            "BACKEND_TIMEOUT": os.environ.get("BACKEND_TIMEOUT", "90"),
        }
        env_str = " ".join(f"{k}='{v}'" for k, v in env.items())
        deps = "pip install -q --disable-pip-version-check scikit-learn gymnasium torchvision pandas requests"
        # Script exécuté au boot de l'instance (onstart) — pas de SSH requis.
        # Concaténation (le code généré contient des accolades).
        onstart = deps + " && " + env_str + " python - << 'MLBLOCK_EOF'\n" + code + "\nMLBLOCK_EOF"

        vast = VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key"))
        instance = vast.launch_instance(
            gpu_name="RTX 3090",
            num_gpus=1,
            image="pytorch/pytorch:latest",
            disk=50,
            onstart=onstart,
        )
        job.vast_instance_id = instance.get("id", "")
        job.status = "dispatched"
        session.add(job)
        session.commit()
        vast.start_instance(job.vast_instance_id)

    # DEV ONLY: auto-destroy instance after 60s if job hasn't completed
    # Prevents orphan GPUs during development when callbacks may not fire.
    # Mode local : pas de coût GPU — le subprocess termine seul, pas de timeout.
    job_id = job.id
    instance_id = job.vast_instance_id

    if _is_mock_vast():
        return job

    gpu_timeout = int(os.environ.get("MLBLOCK_GPU_TIMEOUT", "1800"))  # 30 min par défaut

    def _timeout_cleanup():
        from mlblock.server.database import _get_engine
        from sqlmodel import Session as SqlSession
        with SqlSession(_get_engine()) as s:
            j = s.get(Job, job_id)
            if j and j.status not in ("done", "error"):
                j.status = "error"
                j.error = f"GPU TIMEOUT: job did not complete within {gpu_timeout}s"
                j.completed_at = datetime.now(timezone.utc)
                s.add(j)
                s.commit()
                VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key")).destroy_instance(instance_id)
                _cleanup_pipeline_files(j.pipeline_id)

    threading.Timer(gpu_timeout, _timeout_cleanup).start()

    return job


@pipelines_router.get("/{pipeline_id}/jobs")
def list_pipeline_jobs(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[Job]:
    pipeline = session.get(PipelineTable, pipeline_id)
    if not pipeline or str(pipeline.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    jobs = session.exec(
        select(Job).where(Job.pipeline_id == pipeline_id).order_by(Job.created_at.desc())
    ).all()
    return jobs


@jobs_router.get("/{job_id}")
def get_job(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Job:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    pipeline = session.get(PipelineTable, job.pipeline_id)
    if not pipeline or str(pipeline.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@jobs_router.get("/{job_id}/outputs")
def get_job_outputs(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    """Sorties structurées d'un job (métriques, courbes, images, texte)."""
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    pipeline = session.get(PipelineTable, job.pipeline_id)
    if not pipeline or str(pipeline.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Job not found")
    rows = session.exec(
        select(JobOutput).where(JobOutput.job_id == job_id).order_by(JobOutput.created_at)
    ).all()
    return [
        {"block_name": r.block_name, "output": r.output, "created_at": r.created_at.isoformat()}
        for r in rows
    ]


@jobs_router.post("/{job_id}/status")
def update_job_status(
    job_id: UUID,
    body: JobStatusUpdate,
    _: str = Depends(verify_gpu_key),
    session: Session = Depends(get_session),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = body.status
    if body.status == "running" and not job.started_at:
        job.started_at = datetime.now(timezone.utc)
    if body.status in ("done", "error"):
        job.completed_at = datetime.now(timezone.utc)
        if job.vast_instance_id:
            try:
                vast = VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key"))
                vast.destroy_instance(job.vast_instance_id)
            except Exception:
                pass
        _cleanup_pipeline_files(job.pipeline_id)
    session.add(job)
    session.commit()


@jobs_router.post("/{job_id}/output")
def push_job_output(
    job_id: UUID,
    body: JobOutputPush,
    _: str = Depends(verify_gpu_key),
    session: Session = Depends(get_session),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    output = JobOutput(
        job_id=job_id,
        block_name=body.block,
        output=body.output,
    )
    session.add(output)
    session.commit()


@jobs_router.post("/{job_id}/error")
def push_job_error(
    job_id: UUID,
    body: JobErrorPush,
    _: str = Depends(verify_gpu_key),
    session: Session = Depends(get_session),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "error"
    job.error = body.error
    job.completed_at = datetime.now(timezone.utc)
    if job.vast_instance_id:
        try:
            vast = VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key"))
            vast.destroy_instance(job.vast_instance_id)
        except Exception:
            pass
    _cleanup_pipeline_files(job.pipeline_id)
    session.add(job)
    output = JobOutput(
        job_id=job_id,
        block_name=body.block,
        output=f"ERROR: {body.error}",
    )
    session.add(output)
    session.commit()


# ── Backward Compatible / Auxiliary Routes & Validation ──────────────

@validation_router.post("")
def validate_graph(body: ValidationRequest) -> ValidationResponse:
    errors = []
    try:
        graph_data = {
            "nodes": [n.model_dump() for n in body.nodes],
            "edges": [e.model_dump() for e in body.edges],
        }
        graph = Graph(graph_data)
        graph.validate()
    except ValueError as e:
        errors.append(str(e))
    try:
        from mlblock.blocks.registry import BLOCK_REGISTRY
        from mlblock.models.pipeline import PipelineDef

        PipelineDef.model_validate(
            {"nodes": body.nodes, "edges": body.edges},
            context={"registry": BLOCK_REGISTRY},
        )
    except ValueError as e:
        errors.append(str(e))
    return ValidationResponse(valid=len(errors) == 0, errors=errors)


@pipelines_router.post("/{pipeline_id}/build")
def build_pipeline_model(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")

    from mlblock.core.graph import Graph as CoreGraph
    from mlblock.core.pipeline import Pipeline as CorePipeline

    nodes = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]

    # Fail fast on type-incompatible graphs (same gate as /api/validate)
    try:
        from mlblock.blocks.registry import BLOCK_REGISTRY
        from mlblock.models.pipeline import PipelineDef

        PipelineDef.model_validate(
            {"nodes": nodes, "edges": edges},
            context={"registry": BLOCK_REGISTRY},
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    graph_data = {
        "nodes": [n.model_dump() for n in nodes],
        "edges": [e.model_dump() for e in edges],
    }
    graph = CoreGraph(graph_data)

    import torch
    import torch.nn as nn

    # Pre-populate root nodes (no incoming edges) with dummy tensors
    incoming = {e.target for e in graph.edges}
    for node_id in graph.topological_sort():
        node = graph.nodes[node_id]
        if node_id not in incoming and node.block and node.block.can_build():
            # String params (frontend) must be typed before shape inference
            node.block.coerce_params(node.params)
            # N'injecte in_1 que si le bloc attend un input REQUIS. Les
            # constructeurs de couches (*_layer) ont in_1 optionnel : le build
            # les exécute sans source (nn.Sequential(tensor, ...) crasherait).
            first_name = node.block.inputs[0].get("name", "in_1") if node.block.inputs else None
            first_param = node.block.params.get(first_name, {}) if first_name else {}
            if node.block.inputs and first_param.get("required", True):
                # Racine image (resize/normalize sans source) : tenseur CHW factice
                from mlblock.core.types import family_of
                first_in = node.block.inputs[0].get("dtype", "")
                if family_of(first_in) == "image":
                    node.params["in_1"] = torch.randn(3, 224, 224)
                    continue
                # Infer input shape from params or default to [1, 1, 28, 28]
                shape = node.params.get("shape", node.params.get("in_channels", [1, 1, 28, 28]))
                if isinstance(shape, int):
                    shape = [1, shape, 28, 28]
                elif isinstance(shape, list):
                    shape = [1] + shape if len(shape) < 4 else shape
                node.params["in_1"] = torch.randn(*shape)

    pipeline = CorePipeline(graph)

    try:
        outputs = pipeline.run()
    except Exception as e:
        raise HTTPException(400, detail=str(e))

    if not outputs:
        raise HTTPException(400, detail="Pipeline produced no outputs")

    layers = []
    for node_id in graph.topological_sort():
        node = graph.nodes[node_id]
        if node.block and node.block.can_build():
            try:
                result = outputs.get(node_id)
                if isinstance(result, dict):
                    for v in result.values():
                        if isinstance(v, nn.Module):
                            layers.append(v)
                elif isinstance(result, nn.Module):
                    layers.append(result)
            except Exception:
                pass

    last_output = list(outputs.values())[-1]
    if isinstance(last_output, dict):
        last_output = list(last_output.values())[-1]

    # Pipeline non-neural (sklearn, data) : exécutable mais sans tensor de
    # sortie — le build reste un succès (le run se charge de l'exécution).
    if not isinstance(last_output, torch.Tensor):
        return {
            "success": True,
            "output_shape": None,
            "layer_count": len(layers),
        }

    return {
        "success": True,
        "output_shape": list(last_output.shape),
        "layer_count": len(layers) if layers else len([n for n in graph.topological_sort() if graph.nodes[n].block and graph.nodes[n].block.can_build()]),
    }
