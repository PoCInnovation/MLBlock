import { create } from "zustand";
import { createCatalogSlice, type CatalogSlice } from "./catalogSlice";
import { createGraphSlice, type GraphSlice } from "./graphSlice";
import { createRunSlice, type RunSlice } from "./runSlice";

export type AppStore = CatalogSlice & GraphSlice & RunSlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createCatalogSlice(...a),
  ...createGraphSlice(...a),
  ...createRunSlice(...a),
}));
