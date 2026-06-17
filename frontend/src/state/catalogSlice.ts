import type { StateCreator } from "zustand";
import type { BlockDefinition } from "../blocks/types";
import { fetchBlockRegistry } from "../blocks/registry";

export interface CatalogSlice {
  catalog: {
    status: "idle" | "loading" | "ready" | "error";
    registry: Record<string, BlockDefinition<any>> | null;
    error: string | null;
  };
  loadCatalog: () => Promise<void>;
}

export const createCatalogSlice: StateCreator<CatalogSlice> = (set) => ({
  catalog: {
    status: "idle",
    registry: null,
    error: null,
  },
  loadCatalog: async () => {
    set((s) => ({ catalog: { ...s.catalog, status: "loading", error: null } }));
    try {
      const registry = await fetchBlockRegistry();
      set({ catalog: { status: "ready", registry, error: null } });
    } catch (err) {
      set({
        catalog: {
          status: "error",
          registry: null,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
    }
  },
});
