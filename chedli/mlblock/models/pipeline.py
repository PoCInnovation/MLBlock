from pydantic import BaseModel, Field, model_validator
from typing import Any, Self


class PipelineNode(BaseModel):
    id: str
    type: str
    params: dict[str, Any] = {}
    children: list["PipelineNode"] = Field(default_factory=list)


class PipelineEdge(BaseModel):
    source: str
    source_port: str
    target: str
    target_port: str


class PipelineDef(BaseModel):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]

    @model_validator(mode="after")
    def validate_types_in_registry(self, info: Any) -> Self:
        registry = info.context.get("registry") if info.context else None
        if registry is None:
            return self
        for node in self._all_nodes():
            if node.type not in registry:
                raise ValueError(
                    f"Type de bloc inconnu: '{node.type}' (nœud '{node.id}')"
                )
        return self

    @model_validator(mode="after")
    def validate_edges(self, info: Any) -> Self:
        registry = info.context.get("registry") if info.context else None
        if registry is None:
            return self
        node_map = {n.id: n for n in self._all_nodes()}
        for edge in self.edges:
            for side, port_name in [
                ("source", edge.source_port),
                ("target", edge.target_port),
            ]:
                node_id = getattr(edge, side)
                node = node_map.get(node_id)
                if node is None:
                    raise ValueError(
                        f"Nœud '{node_id}' introuvable (edge: {edge.source}.{edge.source_port} → {edge.target}.{edge.target_port})"
                    )
                spec = registry[node.type]
                direction = "outputs" if side == "source" else "inputs"
                if not any(p.name == port_name for p in getattr(spec, direction)):
                    valid = [p.name for p in getattr(spec, direction)]
                    raise ValueError(
                        f"Port '{port_name}' introuvable sur {side} '{node.id}' ({node.type}). "
                        f"Ports valides: {valid}"
                    )
        return self

    @model_validator(mode="after")
    def validate_dtype_compatibility(self, info: Any) -> Self:
        registry = info.context.get("registry") if info.context else None
        if registry is None:
            return self
        node_map = {n.id: n for n in self._all_nodes()}
        for edge in self.edges:
            src_node = node_map[edge.source]
            tgt_node = node_map[edge.target]
            src_spec = registry[src_node.type]
            tgt_spec = registry[tgt_node.type]
            src_dtype = next(
                p.dtype for p in src_spec.outputs if p.name == edge.source_port
            )
            tgt_dtype = next(
                p.dtype for p in tgt_spec.inputs if p.name == edge.target_port
            )
            if src_dtype != tgt_dtype:
                raise ValueError(
                    f"Type mismatch: {edge.source}.{edge.source_port} ({src_dtype}) → "
                    f"{edge.target}.{edge.target_port} ({tgt_dtype})"
                )
        return self

    def _all_nodes(self):
        result = []

        def walk(nodes):
            for n in nodes:
                result.append(n)
                walk(n.children)

        walk(self.nodes)
        return result
