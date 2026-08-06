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

export type Catalog = z.infer<typeof catalogSchema>
export type ValidationResponse = z.infer<typeof validationSchema>
