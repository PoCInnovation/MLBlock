import { z } from "zod";

export const PortSchema = z.object({
  name: z.string(),
  dtype: z.string(),
});

export const WireNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  params: z.record(z.unknown()),
  ports: z.object({
    in: z.array(PortSchema).optional().default([]),
    out: z.array(PortSchema).optional().default([]),
  }),
});

export const WireEdgeSchema = z.object({
  source: z.string(),
  source_port: z.string(),
  target: z.string(),
  target_port: z.string(),
});

export const WireGraphSchema = z.object({
  nodes: z.array(WireNodeSchema),
  edges: z.array(WireEdgeSchema),
});

export type WireNode = z.infer<typeof WireNodeSchema>;
export type WireEdge = z.infer<typeof WireEdgeSchema>;
export type WireGraph = z.infer<typeof WireGraphSchema>;
