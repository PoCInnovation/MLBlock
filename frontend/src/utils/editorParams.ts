import { z } from 'zod'

/**
 * Paramètres de l'éditeur portés par l'URL : /editor?pipeline=<uuid>
 * — refresh conservé. Toujours safeParse : URL invalide → défauts.
 */
export const editorParamsSchema = z.object({
  pipeline: z.string().uuid().optional(),
})

export type EditorParams = z.infer<typeof editorParamsSchema>

/** Parse les search params — ne lance jamais : fallback sur les défauts. */
export function parseEditorParams(params: URLSearchParams): EditorParams {
  const parsed = editorParamsSchema.safeParse({
    pipeline: params.get('pipeline') ?? undefined,
  })
  return parsed.success ? parsed.data : { pipeline: undefined }
}
