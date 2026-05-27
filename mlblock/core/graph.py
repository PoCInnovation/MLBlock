from __future__ import annotations

from collections import deque
from typing import Any

from .block import BlockRegistry


class GraphNode:
    def __init__(self, node_def: dict[str, Any]) -> None:
        self.id: str = node_def["id"]
        self.type: str = node_def["type"]
        self.params: dict[str, Any] = node_def.get("params", {})
        self.block = BlockRegistry.get(self.type)
        if self.block is None:
            raise ValueError(f"Unknown block type '{self.type}'")

    def __repr__(self) -> str:
        return f"GraphNode({self.id}: {self.type})"


class Edge:
    def __init__(self, edge_def: dict[str, str]) -> None:
        self.source: str = edge_def["source"]
        self.source_port: str = edge_def["source_port"]
        self.target: str = edge_def["target"]
        self.target_port: str = edge_def["target_port"]

    def __repr__(self) -> str:
        return f"Edge({self.source}.{self.source_port} -> {self.target}.{self.target_port})"


class Graph:
    def __init__(self, graph_data: dict[str, Any]) -> None:
        self.nodes: dict[str, GraphNode] = {}
        self.edges: list[Edge] = []
        self._build(graph_data)

    def _build(self, graph_data: dict[str, Any]) -> None:
        for node_def in graph_data["nodes"]:
            node = GraphNode(node_def)
            self.nodes[node.id] = node
        for edge_def in graph_data["edges"]:
            self.edges.append(Edge(edge_def))

    def _build_adjacency(self) -> dict[str, list[str]]:
        adj: dict[str, list[str]] = {nid: [] for nid in self.nodes}
        for edge in self.edges:
            adj[edge.source].append(edge.target)
        return adj

    def _build_in_degree(self) -> dict[str, int]:
        deg: dict[str, int] = {nid: 0 for nid in self.nodes}
        for edge in self.edges:
            deg[edge.target] += 1
        return deg

    def topological_sort(self) -> list[str]:
        adj = self._build_adjacency()
        in_deg = self._build_in_degree()
        queue = deque([nid for nid, d in in_deg.items() if d == 0])
        order: list[str] = []
        while queue:
            node_id = queue.popleft()
            order.append(node_id)
            for neighbor in adj[node_id]:
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)
        if len(order) != len(self.nodes):
            raise ValueError("Graph contains a cycle")
        return order

    def get_input_nodes(self) -> list[GraphNode]:
        targets = {edge.target for edge in self.edges}
        return [n for n in self.nodes.values() if n.id not in targets]

    def get_output_nodes(self) -> list[GraphNode]:
        sources = {edge.source for edge in self.edges}
        return [n for n in self.nodes.values() if n.id not in sources]

    def validate(self) -> None:
        for edge in self.edges:
            if edge.source not in self.nodes:
                raise ValueError(f"Edge source '{edge.source}' not found")
            if edge.target not in self.nodes:
                raise ValueError(f"Edge target '{edge.target}' not found")
        self.topological_sort()
