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
            "label": block.name.replace("_", " ").title(),
            "params": {k: v.model_dump() for k, v in block.params.items()},
            "inputs": block.inputs,
            "outputs": block.outputs,
        })
    return {"categories": list(categories.values())}


# ── Pipelines ───────────────────────────────────────────────────────

def _row_to_summary(row: PipelineTable) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "updated_at": row.updated_at.isoformat(),
    }


def _row_to_detail(row: PipelineTable, nodes, edges) -> PipelineDetail:
    node_schemas = [PipelineNode(**n) if isinstance(n, dict) else n for n in nodes]
    edge_schemas = [PipelineEdge(**e) if isinstance(e, dict) else e for e in edges]
    return PipelineDetail(
        id=row.id,
        name=row.name,
        description=row.description,
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
    query = select(PipelineTable).where(PipelineTable.user_id == UUID(user_id))
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
    # Enforce topological cycle check
    graph_data = {
        "nodes": [n.model_dump() for n in body.nodes],
        "edges": [e.model_dump() for e in body.edges],
    }
    graph = Graph(graph_data)  # raises ValueError on cycle

    row = PipelineTable(
        user_id=UUID(user_id),
        name=body.name,
        description=body.description,
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
        raise HTTPException(status_code=400, detail="Pipeline has no nodes")
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

    # Launch on Vast.ai (or mock)
    vast = VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key"))
    instance = vast.launch_instance(
        gpu_name="RTX 3090",
        num_gpus=1,
        image="pytorch/pytorch:latest",
        disk=50,
    )
    job.vast_instance_id = instance.get("id", "")
    job.status = "dispatched"
    session.add(job)
    session.commit()

    # Generate code and push to GPU
    nodes = [PipelineNode(**n) if isinstance(n, dict) else n for n in row.nodes]
    edges = [PipelineEdge(**e) if isinstance(e, dict) else e for e in row.edges]
    code = generate_code(nodes, edges)
    row.code = code
    session.add(row)
    session.commit()

    # Start instance and execute code
    vast.start_instance(job.vast_instance_id)
    vast.execute(job.vast_instance_id, code)

    # DEV ONLY: auto-destroy instance after 60s if job hasn't completed
    # Prevents orphan GPUs during development when callbacks may not fire
    job_id = job.id
    instance_id = job.vast_instance_id

    def _timeout_cleanup():
        from mlblock.server.database import _get_engine
        from sqlmodel import Session as SqlSession
        with SqlSession(_get_engine()) as s:
            j = s.get(Job, job_id)
            if j and j.status not in ("done", "error"):
                j.status = "error"
                j.error = "DEV TIMEOUT: job did not complete within 60s"
                j.completed_at = datetime.now(timezone.utc)
                s.add(j)
                s.commit()
                VastAI(api_key=os.environ.get("VAST_API_KEY", "mock-vast-key")).destroy_instance(instance_id)
                _cleanup_pipeline_files(j.pipeline_id)

    threading.Timer(60.0, _timeout_cleanup).start()

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

    if not isinstance(last_output, torch.Tensor):
        raise HTTPException(400, detail="Pipeline did not produce a tensor output")

    return {
        "success": True,
        "output_shape": list(last_output.shape),
        "layer_count": len(layers) if layers else len([n for n in graph.topological_sort() if graph.nodes[n].block and graph.nodes[n].block.can_build()]),
    }
