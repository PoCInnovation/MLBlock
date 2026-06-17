import type { WireNode, WireEdge, WireGraph } from "../blocks/schema";

export interface CanvasNode extends WireNode {
  position: { x: number; y: number };
}

export function toWireGraph(canvasNodes: CanvasNode[], edges: WireEdge[]): WireGraph {
  const nodes = canvasNodes.map(({ position, ...rest }) => rest);
  return { nodes, edges };
}

export function fromWireGraph(
  graph: WireGraph,
  savedPositions?: Record<string, { x: number; y: number }>
): { nodes: CanvasNode[]; edges: WireEdge[] } {
  const nodes = graph.nodes.map((n) => ({
    ...n,
    position: savedPositions?.[n.id] ?? { x: 0, y: 0 },
  }));
  return { nodes, edges: graph.edges };
}
