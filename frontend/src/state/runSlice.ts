import type { StateCreator } from "zustand";

export interface RunSlice {
  run: {
    status: "idle" | "running" | "done" | "error";
    result: unknown | null;
    error: string | null;
  };
  setRunStatus: (status: RunSlice["run"]["status"]) => void;
  setRunResult: (result: unknown) => void;
  setRunError: (error: string) => void;
  resetRun: () => void;
}

export const createRunSlice: StateCreator<RunSlice> = (set) => ({
  run: {
    status: "idle",
    result: null,
    error: null,
  },
  setRunStatus: (status) =>
    set((s) => ({ run: { ...s.run, status } })),
  setRunResult: (result) =>
    set({ run: { status: "done", result, error: null } }),
  setRunError: (error) =>
    set({ run: { status: "error", result: null, error } }),
  resetRun: () =>
    set({ run: { status: "idle", result: null, error: null } }),
});
