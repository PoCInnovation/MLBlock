import type { BlockDefinition } from "./types";
import { exampleRegistry } from "./mockdata/blocks";

// TODO once the real dictionnaires endpoint shape is confirmed with the backend
// team: fetch and parse it here instead. For now this resolves with the local
// mock data so the rest of the app can already be built against a real shape.
export async function fetchBlockRegistry(): Promise<Record<string, BlockDefinition<any>>> {
  return exampleRegistry;
}
