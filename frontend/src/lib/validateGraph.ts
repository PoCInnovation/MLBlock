import type { BlockDefinition } from "../blocks/types";
import type { WireGraph } from "../blocks/schema";

export function validateGraph(
  graph: WireGraph,
  registry: Record<string, BlockDefinition<any>>
): string[] {
  const errors: string[] = [];
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const node of graph.nodes) {
    const def = registry[node.type];
    if (!def) {
      errors.push(`Unknown block type "${node.type}" on node ${node.id}`);
      continue;
    }
    const result = def.paramsSchema.safeParse(node.params);
    if (!result.success) {
      errors.push(`Invalid params on ${node.id} (${node.type}): ${result.error.message}`);
    }
  }

  for (const edge of graph.edges) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    const outPort = source?.ports.out.find((p) => p.name === edge.source_port);
    const inPort = target?.ports.in.find((p) => p.name === edge.target_port);
    if (!outPort || !inPort) {
      errors.push(
        `Edge ${edge.source}.${edge.source_port} -> ${edge.target}.${edge.target_port} references a missing port`
      );
    } else if (outPort.dtype !== inPort.dtype) {
      errors.push(
        `Type mismatch: ${edge.source}.${edge.source_port} (${outPort.dtype}) -> ${edge.target}.${edge.target_port} (${inPort.dtype})`
      );
    }
  }

  const inDegree = new Map(graph.nodes.map((n) => [n.id, 0]));
  for (const edge of graph.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }
  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift()!;
    visited++;
    for (const edge of graph.edges.filter((e) => e.source === id)) {
      const d = (inDegree.get(edge.target) ?? 0) - 1;
      inDegree.set(edge.target, d);
      if (d === 0) queue.push(edge.target);
    }
  }
  if (visited !== graph.nodes.length) {
    errors.push("Graph contains a cycle, pipelines must be a DAG");
  }

  return errors;
}
