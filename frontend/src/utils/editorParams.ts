import { z } from 'zod'

/**
 * Paramètres de l'éditeur portés par l'URL : /editor?pipeline=<uuid>&view=free|grid
 * — refresh conservé, vue partageable. Toujours safeParse : URL invalide → défauts.
 */
export const editorParamsSchema = z.object({
  pipeline: z.string().uuid().optional(),
  view: z.enum(['free', 'grid']).default('free'),
})

export type EditorParams = z.infer<typeof editorParamsSchema>

/** Parse les search params — ne lance jamais : fallback sur les défauts. */
export function parseEditorParams(params: URLSearchParams): EditorParams {
  const parsed = editorParamsSchema.safeParse({
    pipeline: params.get('pipeline') ?? undefined,
    view: params.get('view') ?? undefined,
  })
  return parsed.success ? parsed.data : { pipeline: undefined, view: 'free' }
}
