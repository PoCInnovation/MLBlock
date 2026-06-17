import { z } from "zod";

export interface BlockDefinition<P> {
  type: string;
  label: string;
  category: "data" | "model" | "eval";
  paramsSchema: z.ZodType<P>;
  ports: (params: P) => {
    in: { name: string; dtype: string }[];
    out: { name: string; dtype: string }[];
  };
}

export function defineBlock<P>(def: BlockDefinition<P>): BlockDefinition<P> {
  return def;
}
