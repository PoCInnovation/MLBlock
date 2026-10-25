/** CourseWatcher — deep module (diff(PipelineDocument, Course Expected)->hints).
 * Separated from FlowCanvas 900 LOC; subscribes to PipelineDocument changes.
 */
import type { Node, Edge } from '@xyflow/react'

export type CourseExpected = { types?: string[]; edges?: [string, string][] }

export type WatcherHints = { missing: string[]; extra: string[]; edgeMismatch: boolean }

export function diffCourse(actualNodes: Node[], actualEdges: Edge[], expected: CourseExpected): WatcherHints {
  const actualTypes = actualNodes.map(n => (n.data as { type?: string })?.type ?? '')
  const expectedTypes = expected.types ?? []
  const missing = expectedTypes.filter(t => !actualTypes.includes(t))
  const extra = actualTypes.filter(t => !expectedTypes.includes(t))
  const edgeMismatch = expected.edges ? expected.edges.length !== actualEdges.length : false
  return { missing, extra, edgeMismatch }
}

export type ExpectedCourseData = {
  nodes: { id: string; type: string }[]
  edges: { from: string; fromPort?: string; to: string; toPort?: string }[]
  hints?: Record<string, string>
}

export type CourseEvaluation = {
  missingTypes: string[]
  extraTypes: string[]
  edgeMismatch: boolean
  activeHints: string[]
  isComplete: boolean
  progressPercent: number
}

function getNodeType(n: Node): string {
  const d = n.data as { type?: string } | undefined
  return d?.type ?? ''
}

export function evaluateCourseProgress(
  actualNodes: Node[],
  actualEdges: Edge[],
  expected: ExpectedCourseData
): CourseEvaluation {
  const actualTypes = actualNodes.map(getNodeType).filter(Boolean)
  const actualTypeSet = new Set(actualTypes)
  const expectedTypes = expected.nodes.map(n => n.type)
  const expectedTypeSet = new Set(expectedTypes)

  const missingTypes = expectedTypes.filter(t => !actualTypeSet.has(t))
  const extraTypes = actualTypes.filter(t => !expectedTypeSet.has(t))

  const idToType = new Map(expected.nodes.map(n => [n.id, n.type] as const))
  let edgeMismatch = false

  for (const e of expected.edges) {
    const fromType = idToType.get(e.from)
    const toType = idToType.get(e.to)
    if (!fromType || !toType) continue

    const found = actualEdges.some(fe => {
      const sN = actualNodes.find(n => n.id === fe.source)
      const tN = actualNodes.find(n => n.id === fe.target)
      if (!sN || !tN) return false
      return getNodeType(sN) === fromType && getNodeType(tN) === toType
    })
    if (!found) {
      edgeMismatch = true
      break
    }
  }

  const activeHints: string[] = []
  if (expected.hints) {
    for (const m of missingTypes) {
      if (expected.hints[m]) activeHints.push(expected.hints[m])
    }
  }

  const satisfiedNodes = expectedTypes.length - missingTypes.length
  const totalSteps = expectedTypes.length + (expected.edges.length > 0 ? 1 : 0)
  const currentSteps = satisfiedNodes + (!edgeMismatch && expected.edges.length > 0 && missingTypes.length === 0 ? 1 : 0)
  const progressPercent = totalSteps > 0 ? Math.round((currentSteps / totalSteps) * 100) : 0
  const isComplete = missingTypes.length === 0 && !edgeMismatch

  return {
    missingTypes,
    extraTypes,
    edgeMismatch,
    activeHints,
    isComplete,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  }
}
