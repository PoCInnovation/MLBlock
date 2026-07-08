from __future__ import annotations

from datetime import datetime, timezone


import torch
import torch.nn as nn
from pydantic import ValidationError
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.block import BlockMeta, BlockRegistry as CoreBlockRegistry
from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline
from mlblock.models.pipeline import PipelineDef
from mlblock.models.registry import BlockRegistry as SpecRegistry
from mlblock.server.database import get_session
from mlblock.server.models import Pipeline as PipelineTable
from mlblock.server.schemas import (
    BlockDetail,
    BlockSummary,
    BuildResponse,
    GenerateResponse,
    Page,
    PipelineCreate,
    PipelineDetail,
    PipelineSummary,
    PipelineUpdate,
    ValidationRequest,
    ValidationResponse,
)

blocks_router = APIRouter(prefix="/api/blocks")
pipelines_router = APIRouter(prefix="/api/pipelines")
validation_router = APIRouter(prefix="/api/validate")


def _build_registry() -> SpecRegistry:
    from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec
    spec_registry = SpecRegistry()
    for name, block_dict in BLOCK_REGISTRY.items():
        if isinstance(block_dict, dict):
            params = {}
            for k, v in block_dict.get("params", {}).items():
                if isinstance(v, dict):
                    params[k] = ParamSpec(**v)
                else:
                    params[k] = v
            inputs = [PortSpec(**p) if isinstance(p, dict) else p for p in block_dict.get("inputs", [])]
            outputs = [PortSpec(**p) if isinstance(p, dict) else p for p in block_dict.get("outputs", [])]
            spec_registry[name] = BlockSpec(
                label=block_dict.get("label", name),
                category=block_dict.get("category", "unknown"),
                params=params,
                inputs=inputs,
                outputs=outputs,
                template=block_dict.get("template", ""),
            )
        else:
            spec_registry[name] = block_dict
    return spec_registry


# ── Blocks ──────────────────────────────────────────────────────────


def _meta_to_summary(type_name: str, meta: BlockMeta) -> BlockSummary:
    return BlockSummary(
        type=type_name,
        label=meta.label,
        category=meta.category,
        inputs=len(meta.inputs),
        outputs=len(meta.outputs),
        can_build=meta.can_build(),
    )


@blocks_router.get("")
def list_blocks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    search: str | None = None,
) -> Page[BlockSummary]:
    items = list(CoreBlockRegistry._blocks.items())

    if category:
        items = [(n, m) for n, m in items if m.category == category]

    if search:
        lower = search.lower()
        items = [(n, m) for n, m in items if lower in m.label.lower()]

    total = len(items)
    start = (page - 1) * size
    sliced = items[start : start + size]
    summaries = [_meta_to_summary(n, m) for n, m in sliced]

    return Page(items=summaries, total=total, page=page, size=size)


@blocks_router.get("/categories")
def list_categories() -> dict[str, list[str]]:
    categories = sorted(
        {m.category for m in CoreBlockRegistry._blocks.values()}
    )
    return {"categories": categories}


@blocks_router.get("/{type_name}")
def get_block(type_name: str) -> BlockDetail:
    meta = CoreBlockRegistry.get(type_name)
    if meta is None:
        raise HTTPException(404, f"Block type '{type_name}' not found")
    s = meta.spec
    return BlockDetail(
        type=type_name,
        label=meta.label,
        category=meta.category,
        params=s["params"],
        inputs=s.get("inputs", []),
        outputs=s.get("outputs", []),
        template=s.get("template", ""),
        children_allowed=s.get("children_allowed", False),
        can_build=meta.can_build(),
        generates_class=s.get("generates_class"),
        class_base=s.get("class_base"),
    )


# ── Pipelines ───────────────────────────────────────────────────────


def _row_to_summary(row: PipelineTable) -> PipelineSummary:
    return PipelineSummary(
        id=row.id,
        name=row.name,
        description=row.description,
        created_at=row.created_at,
        updated_at=row.updated_at,
        node_count=len(row.nodes) if row.nodes else 0,
    )


def _row_to_detail(row: PipelineTable, nodes, edges) -> PipelineDetail:
    return PipelineDetail(
        id=row.id,
        name=row.name,
        description=row.description,
        created_at=row.created_at,
        updated_at=row.updated_at,
        node_count=len(row.nodes) if row.nodes else 0,
        nodes=nodes,
        edges=edges,
    )


@pipelines_router.get("")
def list_pipelines(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    session: Session = Depends(get_session),
) -> Page[PipelineSummary]:
    query = select(PipelineTable)
    if search:
        query = query.where(PipelineTable.name.ilike(f"%{search}%"))
    total = len(session.exec(query).all())

    query = query.offset((page - 1) * size).limit(size)
    rows = session.exec(query).all()
    items = [_row_to_summary(r) for r in rows]

    return Page(items=items, total=total, page=page, size=size)


@pipelines_router.post("", status_code=201)
def create_pipeline(
    body: PipelineCreate,
    session: Session = Depends(get_session),
) -> PipelineDetail:
    _validate_graph(body.nodes, body.edges)

    row = PipelineTable(
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
    pipeline_id: int,
    session: Session = Depends(get_session),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")
    from mlblock.models.pipeline import PipelineEdge, PipelineNode

    nodes = [PipelineNode(**n) for n in (row.nodes or [])]
    edges = [PipelineEdge(**e) for e in (row.edges or [])]
    return _row_to_detail(row, nodes, edges)


@pipelines_router.put("/{pipeline_id}")
def update_pipeline(
    pipeline_id: int,
    body: PipelineCreate,
    session: Session = Depends(get_session),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")

    _validate_graph(body.nodes, body.edges)

    row.name = body.name
    row.description = body.description
    row.nodes = [n.model_dump() for n in body.nodes]
    row.edges = [e.model_dump() for e in body.edges]
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _row_to_detail(row, body.nodes, body.edges)


@pipelines_router.delete("/{pipeline_id}", status_code=204)
def delete_pipeline(
    pipeline_id: int,
    session: Session = Depends(get_session),
) -> None:
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")
    session.delete(row)
    session.commit()


@pipelines_router.post("/{pipeline_id}/generate")
def generate_pipeline_code(
    pipeline_id: int,
    session: Session = Depends(get_session),
) -> GenerateResponse:
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")
    if not row.nodes:
        raise HTTPException(400, "Pipeline has no nodes")

    graph_data = {"nodes": row.nodes, "edges": row.edges}
    _validate_graph_data(graph_data)

    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    return GenerateResponse(code=code)


@pipelines_router.post("/{pipeline_id}/build")
def build_pipeline_model(
    pipeline_id: int,
    session: Session = Depends(get_session),
) -> BuildResponse:
    row = session.get(PipelineTable, pipeline_id)
    if row is None:
        raise HTTPException(404, "Pipeline not found")
    if not row.nodes:
        raise HTTPException(400, "Pipeline has no nodes")

    graph_data = {"nodes": row.nodes, "edges": row.edges}

    # Vérifier que tous les blocs supportent build_layer()
    unbuildable: list[str] = []
    for node_def in graph_data["nodes"]:
        meta = CoreBlockRegistry.get(node_def["type"])
        if meta is None:
            raise HTTPException(422, f"Unknown block type '{node_def['type']}'")
        if not meta.can_build():
            unbuildable.append(f"'{node_def['id']}' ({meta.label})")
    if unbuildable:
        raise HTTPException(
            400,
            f"Cannot build model: blocks without BUILD function: {', '.join(unbuildable)}",
        )

    try:
        graph = Graph(graph_data)
        pipeline = Pipeline(graph)
        outputs = pipeline.build_model()

        # Extract nn.Module layers from nested output dicts
        layers: list[nn.Module] = []
        for result in outputs.values():
            if isinstance(result, dict):
                for v in result.values():
                    if isinstance(v, nn.Module):
                        layers.append(v)
            elif isinstance(result, nn.Module):
                layers.append(result)

        if not layers:
            return BuildResponse(success=False, error="No nn.Module layers found in pipeline")

        model = nn.Sequential(*layers) if len(layers) > 1 else layers[0]

        input_node = graph.get_input_nodes()
        shape: list[int] = [1, 28, 28]
        if input_node:
            shape = input_node[0].params.get("shape", [1, 28, 28])

        dummy = torch.randn(1, *shape)
        output = model(dummy)

        return BuildResponse(
            success=True,
            output_shape=list(output.shape),
            output_values=output[:1].tolist(),
            layer_count=len(layers),
        )
    except Exception as e:
        return BuildResponse(success=False, error=str(e))


# ── Validation ──────────────────────────────────────────────────────


@validation_router.post("")
def validate_graph(body: ValidationRequest) -> ValidationResponse:
    errors: list[str] = []

    graph_data = {
        "nodes": [n.model_dump() for n in body.nodes],
        "edges": [e.model_dump() for e in body.edges],
    }

    # Validation Pydantic (types, ports, dtypes)
    try:
        _validate_graph_data(graph_data)
    except (ValueError, HTTPException) as e:
        errors.append(str(e))

    # Validation de graphe (nœuds, cycles)
    if not errors:
        try:
            graph = Graph(graph_data)
            graph.validate()
        except ValueError as e:
            errors.append(str(e))

    if errors:
        return ValidationResponse(valid=False, errors=errors)
    return ValidationResponse(valid=True, errors=[])


# ── Helpers ─────────────────────────────────────────────────────────


def _validate_graph(nodes, edges) -> None:
    """Validate graph nodes/edges via PipelineDef.model_validate."""
    if not nodes and not edges:
        return
    graph_data = {
        "nodes": [n.model_dump() for n in nodes],
        "edges": [e.model_dump() for e in edges],
    }
    _validate_graph_data(graph_data)


def _validate_graph_data(graph_data: dict) -> None:
    registry = _build_registry()
    try:
        PipelineDef.model_validate(graph_data, context={"registry": registry})
    except (ValueError, ValidationError) as e:
        raise ValueError(str(e)) from e
