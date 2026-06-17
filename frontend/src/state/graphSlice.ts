import type { StateCreator } from "zustand";
import type { CanvasNode } from "../lib/graphMappers";
import type { WireEdge } from "../blocks/schema";

export interface GraphSlice {
  graph: {
    nodes: CanvasNode[];
    edges: WireEdge[];
    selectedNodeId: string | null;
  };
  addNode: (node: CanvasNode) => void;
  updateNode: (id: string, patch: Partial<CanvasNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: WireEdge) => void;
  removeEdge: (source: string, sourcePort: string, target: string, targetPort: string) => void;
  selectNode: (id: string | null) => void;
}

export const createGraphSlice: StateCreator<GraphSlice> = (set) => ({
  graph: {
    nodes: [],
    edges: [],
    selectedNodeId: null,
  },
  addNode: (node) =>
    set((s) => ({ graph: { ...s.graph, nodes: [...s.graph.nodes, node] } })),
  updateNode: (id, patch) =>
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      },
    })),
  removeNode: (id) =>
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.filter((n) => n.id !== id),
        edges: s.graph.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.graph.selectedNodeId === id ? null : s.graph.selectedNodeId,
      },
    })),
  addEdge: (edge) =>
    set((s) => ({ graph: { ...s.graph, edges: [...s.graph.edges, edge] } })),
  removeEdge: (source, sourcePort, target, targetPort) =>
    set((s) => ({
      graph: {
        ...s.graph,
        edges: s.graph.edges.filter(
          (e) =>
            !(
              e.source === source &&
              e.source_port === sourcePort &&
              e.target === target &&
              e.target_port === targetPort
            )
        ),
      },
    })),
  selectNode: (id) =>
    set((s) => ({ graph: { ...s.graph, selectedNodeId: id } })),
});
