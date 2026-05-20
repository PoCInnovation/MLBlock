from collections import deque
from mlblock.models.pipeline import PipelineDef, PipelineNode


class DAGResolver:
    def resolve(self, pipeline: PipelineDef) -> list[PipelineNode]:
        node_map = {n.id: n for n in pipeline._all_nodes()}
        edges_by_target: dict[str, list[tuple[str, str]]] = {}
        for e in pipeline.edges:
            edges_by_target.setdefault(e.target, []).append((e.source, e.source_port))

        in_degree: dict[str, int] = {n.id: 0 for n in pipeline.nodes}
        for node in pipeline.nodes:
            if node.children:
                for child in node.children:
                    in_degree[child.id] = 0
        for e in pipeline.edges:
            in_degree[e.target] = in_degree.get(e.target, 0) + 1

        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        ordered: list[PipelineNode] = []

        while queue:
            nid = queue.popleft()
            node = node_map[nid]
            ordered.append(node)
            if node.children:
                self._resolve_nested(node, pipeline, node_map)

            for e in pipeline.edges:
                if e.source == nid:
                    in_degree[e.target] -= 1
                    if in_degree[e.target] == 0:
                        queue.append(e.target)

        if len(ordered) != len(node_map):
            cycle_nodes = [n.id for n in pipeline.nodes if in_degree.get(n.id, 0) > 0]
            raise ValueError(
                f"Cycle détecté dans le pipeline. Nœuds impliqués: {cycle_nodes}"
            )

        return ordered

    def _resolve_nested(
        self, parent: PipelineNode, pipeline: PipelineDef, node_map: dict[str, PipelineNode]
    ):
        for child in parent.children:
            if child.children:
                self._resolve_nested(child, pipeline, node_map)
