import { z } from 'zod'

const paramSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  default: z.unknown().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  step: z.number().nullable().optional(),
  odd: z.boolean().nullable().optional(),
  choices: z.array(z.string()).nullable().optional(),
  suggestions: z.array(z.string()).nullable().optional(),
  format: z.string().nullable().optional(),
  len: z.number().nullable().optional(),
})

const blockSchema = z.object({
  type: z.string(),
  label: z.string(),
  description: z.string().optional(),
  params: z.record(z.string(), paramSchema),
  inputs: z.array(z.record(z.string(), z.string())),
  outputs: z.array(z.record(z.string(), z.string())),
})

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  blocks: z.array(blockSchema),
})

export const catalogSchema = z.object({
  categories: z.array(categorySchema),
})

export const validationSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
})

// Structural type mirrors types/catalog.ts PipelineNode (position optional+nullable).
// Required for the recursive z.lazy self-reference — TS cannot infer the cycle.
type PipelineNodeShape = {
  id: string
  type: string
  params: Record<string, unknown>
  children: PipelineNodeShape[]
  position?: { x: number; y: number } | null
}

export const pipelineNodeSchema: z.ZodType<PipelineNodeShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    params: z.record(z.string(), z.unknown()),
    children: z.array(pipelineNodeSchema),
    position: z.object({ x: z.number(), y: z.number() }).nullish(),
  }),
)

export const pipelineEdgeSchema = z.object({
  source: z.string(),
  source_port: z.string(),
  target: z.string(),
  target_port: z.string(),
})

export const pipelineCreateSchema = z.object({
  name: z.string(),
  description: z.string(),
  is_draft: z.boolean().optional(),
  nodes: z.array(pipelineNodeSchema),
  edges: z.array(pipelineEdgeSchema),
})

export const pipelineSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  is_draft: z.boolean(),
  updated_at: z.string(),
})

export const pipelineDetailSchema = pipelineSummarySchema.extend({
  nodes: z.array(pipelineNodeSchema),
  edges: z.array(pipelineEdgeSchema),
})

export const pipelinePageSchema = z.object({
  items: z.array(pipelineSummarySchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  pages: z.number(),
})

export const jobStatusSchema = z.enum(['queued', 'dispatched', 'running', 'done', 'error'])

export const jobSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  pipeline_id: z.string(),
  status: jobStatusSchema,
  vast_instance_id: z.string(),
  output: z.string(),
  error: z.string(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
})

export const jobOutputSchema = z.object({
  block_name: z.string(),
  block_id: z.string().nullable().optional(),
  output: z.string(),
  created_at: z.string(),
})

export const buildResponseSchema = z.object({
  success: z.boolean(),
  output_shape: z.array(z.number()).nullable(),
  output_values: z.array(z.array(z.number())).nullish(),
  layer_count: z.number(),
  error: z.string().nullish(),
})

export const generateResponseSchema = z.object({
  code: z.string(),
})

export type Catalog = z.infer<typeof catalogSchema>
export type ValidationResponse = z.infer<typeof validationSchema>
export type PipelineNode = z.infer<typeof pipelineNodeSchema>
export type PipelineEdge = z.infer<typeof pipelineEdgeSchema>
export type PipelineCreate = z.infer<typeof pipelineCreateSchema>
export type PipelineSummary = z.infer<typeof pipelineSummarySchema>
export type PipelineDetail = z.infer<typeof pipelineDetailSchema>
export type PipelinePage = z.infer<typeof pipelinePageSchema>
export type JobStatus = z.infer<typeof jobStatusSchema>
export type Job = z.infer<typeof jobSchema>
export type JobOutput = z.infer<typeof jobOutputSchema>
export type BuildResponse = z.infer<typeof buildResponseSchema>
export type GenerateResponse = z.infer<typeof generateResponseSchema>
