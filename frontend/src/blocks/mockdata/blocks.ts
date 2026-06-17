import { z } from "zod";
import { defineBlock } from "../types";

export const exampleRegistry = {
  load_csv: defineBlock({
    type: "load_csv",
    label: "Charger un CSV",
    category: "data",
    paramsSchema: z.object({ path: z.string().min(1) }),
    ports: () => ({ in: [], out: [{ name: "dataset", dtype: "DataFrame" }] }),
  }),
  train_test_split: defineBlock({
    type: "train_test_split",
    label: "Découpage train/test",
    category: "data",
    paramsSchema: z.object({ ratio: z.number().min(0).max(1) }),
    ports: () => ({
      in: [{ name: "dataset", dtype: "DataFrame" }],
      out: [
        { name: "train", dtype: "DataFrame" },
        { name: "test", dtype: "DataFrame" },
      ],
    }),
  }),
  linear_regression: defineBlock({
    type: "linear_regression",
    label: "Régression linéaire",
    category: "model",
    paramsSchema: z.object({}),
    ports: () => ({
      in: [{ name: "train_data", dtype: "DataFrame" }],
      out: [{ name: "model", dtype: "Model" }],
    }),
  }),
  evaluate: defineBlock({
    type: "evaluate",
    label: "Évaluer",
    category: "eval",
    paramsSchema: z.object({ metric: z.enum(["mse", "mae", "r2"]) }),
    ports: () => ({
      in: [
        { name: "model", dtype: "Model" },
        { name: "test_data", dtype: "DataFrame" },
      ],
      out: [{ name: "score", dtype: "float" }],
    }),
  }),
} as const;

export type BlockType = keyof typeof exampleRegistry;
