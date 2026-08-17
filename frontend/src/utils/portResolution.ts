import type { Port } from '../types/catalog'
import { WILDCARDS, classifyEdge, type Verdict } from './typeCheck'

export type ResolvedConnection = {
  /** Port de sortie résolu côté source. */
  sourcePort: string
  /** Port d'entrée résolu côté cible. */
  targetPort: string
  verdict: Verdict
}

/**
 * Un côté est ambigu quand plusieurs ports partagent le même dtype : la
 * résolution automatique ne peut pas départager, l'utilisateur doit choisir
 * son handle explicitement (tensor_dataset in Tensor×2, train_model in
 * Module×2, random_split out Dataset×2…).
 */
export function isAmbiguous(ports: Port[]): boolean {
  return new Set(ports.map(p => p.dtype)).size !== ports.length
}

/**
 * Score de compatibilité d'un couple (source, target) :
 * 3 = dtype identique, 2 = wildcard cible ou même famille, 1 = convertible,
 * 0 = incompatible. Le score plus fin que classifyEdge préserve la priorité
 * exact > wildcard (sinon plot_predictions in_1=object gagnerait sur in_2
 * exact par ordre de déclaration).
 */
function scoreFor(srcDtype: string, tgtDtype: string, graph: Map<string, Set<string>>): number {
  if (srcDtype === tgtDtype) return 3
  if (WILDCARDS.has(tgtDtype)) return 2
  const verdict = classifyEdge(srcDtype, tgtDtype, graph)
  if (verdict === 'compatible') return 2
  if (verdict === 'convertible') return 1
  return 0
}

/**
 * Candidats d'un côté : côté ambigu → uniquement le handle cliqué (choix
 * utilisateur figé, sinon le premier port) ; côté non-ambigu → tous les
 * ports (le point unique représente tous les inputs/outputs).
 */
function candidates(ports: Port[] | undefined, handle: string | null | undefined, ambiguous: boolean): Port[] {
  if (!ports || ports.length === 0) return []
  if (ambiguous) {
    const picked = handle ? ports.filter(p => p.name === handle) : []
    return picked.length > 0 ? picked : ports.slice(0, 1)
  }
  return ports
}

/**
 * Résout le couple (sourcePort, targetPort) le plus compatible entre deux
 * blocs. Retourne null si aucun couple compatible/convertible. L'égalité de
 * score est départagée par l'ordre de déclaration des ports.
 */
export function resolveConnection(
  srcPorts: Port[] | undefined,
  tgtPorts: Port[] | undefined,
  srcHandle: string | null | undefined,
  tgtHandle: string | null | undefined,
  graph: Map<string, Set<string>>,
): ResolvedConnection | null {
  const srcCand = candidates(srcPorts, srcHandle, isAmbiguous(srcPorts ?? []))
  const tgtCand = candidates(tgtPorts, tgtHandle, isAmbiguous(tgtPorts ?? []))
  if (srcCand.length === 0 || tgtCand.length === 0) return null

  let best: { s: Port; t: Port; score: number } | null = null
  for (const s of srcCand) {
    for (const t of tgtCand) {
      const score = scoreFor(s.dtype, t.dtype, graph)
      if (!best || score > best.score) best = { s, t, score }
    }
  }
  if (!best || best.score === 0) return null
  return {
    sourcePort: best.s.name,
    targetPort: best.t.name,
    verdict: best.score === 1 ? 'convertible' : 'compatible',
  }
}
