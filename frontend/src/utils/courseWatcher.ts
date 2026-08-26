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
