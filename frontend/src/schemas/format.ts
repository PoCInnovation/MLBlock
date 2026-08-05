import { z } from 'zod'

export function formatZodError(err: unknown): string {
  if (err instanceof z.ZodError) {
    const issue = err.issues[0]
    return issue ? issue.message : 'Données invalides'
  }
  return err instanceof Error ? err.message : 'Erreur inconnue'
}
