import { create } from 'zustand'
import { toServerPayload as _toServerPayload, fingerprintOf as _fingerprintOf, backfillNodes } from './pipelineDocument'
import type { InternalCatalog } from '../types/catalog'
import type { PipelineNode, PipelineEdge, Job, JobOutput, JobStatus } from '../types/catalog'
import { createPipeline, updatePipeline } from '../api/client'
// Deep PipelineDocument owns fingerprint/backfill/undo; store is thin glue.
// toServerPayload re-exported via pipelineDocument for single owner (was utils/blockHelpers + flowConversion)
const toServerPayload = _toServerPayload
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

type ConsoleLine = { k: string; t: string }

type Toast = {
  kind: 'error' | 'convert' | 'success'
  message: string
  action?: () => void
}

type DragBase = {
  active: boolean
  type: string
  sx: number; sy: number
  x: number;  y: number
  insertIndex: number
  overCanvas: boolean
  moved: boolean
  color: string
  label: string
}

type DragState = DragBase & { source: 'palette' }

/** Snapshot d'undo/redo : état sémantique du pipeline (ReactFlow direct —
    les métadonnées temporaires sont recalculées au restore). */
type UndoSnapshot = { nodes: Node[]; edges: Edge[]; name: string }

type AppState = {
  category: string
  user: unknown | null
  flowNodes: Node[]
  flowEdges: Edge[]
  consoleLines: ConsoleLine[]
  drag: DragState | null
  catalog: InternalCatalog | null
  catalogError: boolean
  catalogErrorMessage: string | null
  pipelineId: string | null
  projectName: string
  lastJobId: string | null
  lastJobInstanceId: string | null
  jobStatus: JobStatus | null
  results: JobOutput[]
  jobOutputs: JobOutput[]
  savedFingerprint: string | null
  restoredWork: boolean
  toast: Toast | null

  undoStack: UndoSnapshot[]
  redoStack: UndoSnapshot[]

  setUser: (user: unknown | null) => void
  setCategory: (id: string) => void
  setDrag: (drag: DragState) => void
  clearDrag: () => void
  setFlowNodes: (nodes: Node[]) => void
  setFlowEdges: (edges: Edge[]) => void
  applyFlowNodeChanges: (changes: NodeChange[]) => void
  applyFlowEdgeChanges: (changes: EdgeChange[]) => void
  addFlowNode: (node: Node) => void
  addFlowEdges: (edges: Edge[]) => void
  updateFlowParam: (nodeId: string, k: string, v: string) => void
  removeFlowNode: (nodeId: string) => void
  appendConsoleLines: (lines: ConsoleLine[]) => void
  clearAll: () => void
  setCatalog: (catalog: InternalCatalog) => void
  setCatalogError: (error: boolean, message?: string) => void
  setPipelineId: (id: string | null) => void
  setProjectName: (name: string) => void
  commitUndoPoint: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  isDirty: () => boolean
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[], pipelineId: string, name: string) => void
  savePipeline: (name: string) => Promise<void>
  ensureDraft: () => Promise<string>
  setLastJob: (job: Job) => void
  setJobStatus: (status: JobStatus | null) => void
  setResults: (outputs: JobOutput[]) => void
  setJobOutputs: (outputs: JobOutput[]) => void
  setRestoredWork: (v: boolean) => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}



/** Empreinte du canvas : delegates to deep PipelineDocument (single owner). */
export const fingerprintOf = _fingerprintOf

const useAppStore = create<AppState>((set, get) => ({
  category: 'data',
  flowNodes: [],
  flowEdges: [],
  consoleLines: [],
  drag: null,
  user: null,
  catalog: null,
  catalogError: false,
  catalogErrorMessage: null,
  pipelineId: null,
  projectName: 'mon-premier-modèle',
  lastJobId: null,
  lastJobInstanceId: null,
  jobStatus: null,
  results: [],
  jobOutputs: [],
  savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle' }),
  restoredWork: false,
  toast: null,
  undoStack: [],
  redoStack: [],

  setCategory: (id) => set({ category: id }),

  setFlowNodes: (nodes) => set({ flowNodes: nodes }),
  setFlowEdges: (edges) => set({ flowEdges: edges }),
  // Controlled-flow actions: the store is the single source of truth for the
  // advanced canvas — no canvas↔store sync effects, no render loops.
  applyFlowNodeChanges: (changes) => set((s) => ({ flowNodes: applyNodeChanges(changes, s.flowNodes) })),
  applyFlowEdgeChanges: (changes) => set((s) => ({ flowEdges: applyEdgeChanges(changes, s.flowEdges) })),
  addFlowNode: (node) => set((s) => ({ flowNodes: [...s.flowNodes, node] })),
  addFlowEdges: (edges) => set((s) => ({ flowEdges: [...s.flowEdges, ...edges] })),
  updateFlowParam: (nodeId, k, v) => set((s) => ({
    flowNodes: s.flowNodes.map(n => n.id === nodeId
      ? { ...n, data: { ...(n.data as { fields?: Record<string, string> }), fields: { ...(n.data as { fields?: Record<string, string> })?.fields, [k]: v } } }
      : n),
  })),
  removeFlowNode: (nodeId) => {
    const s = get()
    set({
      flowNodes: s.flowNodes.filter(n => n.id !== nodeId),
      flowEdges: s.flowEdges.filter(e => e.source !== nodeId && e.target !== nodeId),
    })
  },

  setDrag: (drag) => set({ drag }),
  clearDrag: () => set({ drag: null }),

  appendConsoleLines: (lines) => set((s) => ({ consoleLines: [...s.consoleLines, ...lines] })),

  clearAll: () => set({ flowNodes: [], flowEdges: [], consoleLines: [], lastJobId: null, lastJobInstanceId: null, jobStatus: null, results: [], jobOutputs: [] }),


  setCatalog: (catalog) => set((s) => {
    const firstCat = catalog.categories[0]?.id ?? 'data'
    const catExists = catalog.categories.some(c => c.id === s.category)
    // Deep PipelineDocument owns backfill (single owner, was inline + duplicated)
    const flowNodes = backfillNodes(s.flowNodes, catalog)
    const needsBackfill = flowNodes !== s.flowNodes
    const savedFingerprint = needsBackfill
      ? fingerprintOf({ flowNodes, flowEdges: s.flowEdges, projectName: s.projectName })
      : s.savedFingerprint
    return { catalog, category: catExists ? s.category : firstCat, flowNodes, savedFingerprint }
  }),

  setCatalogError: (error, message) => set({
    catalogError: error,
    catalogErrorMessage: message ?? null,
  }),

  setPipelineId: (id) => set({ pipelineId: id }),
  setProjectName: (name) => set({ projectName: name }),

  // Undo/redo : snapshot de l'état AVANT chaque geste (commit explicite aux
  // points de capture). Pile max 50, évincement du plus ancien ; un nouveau
  // commit après undo tronque la pile de redo (comportement standard).
  commitUndoPoint: () => set((s) => ({
    undoStack: [...s.undoStack.slice(-49), { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName }],
    redoStack: [],
  })),
  undo: () => {
    const s = get()
    if (!s.undoStack.length) return
    const snap = s.undoStack[s.undoStack.length - 1]
    set({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName }],
      flowNodes: snap.nodes,
      flowEdges: snap.edges,
      projectName: snap.name,
    })
  },
  redo: () => {
    const s = get()
    if (!s.redoStack.length) return
    const snap = s.redoStack[s.redoStack.length - 1]
    set({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName }],
      flowNodes: snap.nodes,
      flowEdges: snap.edges,
      projectName: snap.name,
    })
  },
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  isDirty: () => {
    const s = get()
    if (s.savedFingerprint === null) return false
    return fingerprintOf(s) !== s.savedFingerprint
  },

  loadPipeline: (nodes, edges, pipelineId, name) => {
    const s = get()
    // Construction directe des nodes flow depuis le JSON serveur. Sans
    // catalogue, les segs/inputs/outputs sont vides — le backfill setCatalog
    // les enrichit à l'arrivée du catalogue.
    const flowNodes: Node[] = nodes.map((n, i) => {
      const def = s.catalog?.blocks[n.type]
      const first = def?.segs[0]
      return {
        id: n.id,
        type: 'block',
        dragHandle: '.block-drag-handle',
        position: n.position ?? { x: 100, y: 80 + i * 120 },
        data: {
          type: n.type,
          label: first?.t === 'text' ? first.v : n.type,
          category: def?.cat ?? 'unknown',
          categoryColor: s.catalog?.categories.find(c => c.id === def?.cat)?.color ?? '#888',
          segs: def?.segs ?? [],
          fields: Object.fromEntries(Object.entries(n.params ?? {}).map(([k, v]) => [k, String(v)])),
          inputs: def?.inputs ?? [],
          outputs: def?.outputs ?? [],
        },
      }
    })
    const flowEdges: Edge[] = edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      sourceHandle: e.source_port,
      target: e.target,
      targetHandle: e.target_port,
    }))
    set({
      flowNodes,
      flowEdges,
      pipelineId,
      projectName: name,
      savedFingerprint: fingerprintOf({ flowNodes, flowEdges, projectName: name }),
      undoStack: [],
      redoStack: [],
    })
  },

  savePipeline: async (name) => {
    const s = get()
    const payload = toServerPayload(s)
    const body = { name, description: '', is_draft: false, ...payload }
    const detail = s.pipelineId === null
      ? await createPipeline(body)
      : await updatePipeline(s.pipelineId, body)
    set({
      pipelineId: detail.id,
      projectName: detail.name,
      savedFingerprint: fingerprintOf({ flowNodes: s.flowNodes, flowEdges: s.flowEdges, projectName: detail.name }),
    })
  },

  ensureDraft: async () => {
    const s = get()
    if (s.pipelineId !== null) return s.pipelineId
    const { nodes, edges } = toServerPayload(s)
    const created = await createPipeline({ name: 'mon-premier-modèle', description: '', is_draft: true, nodes, edges })
    set({ pipelineId: created.id })
    return created.id
  },

  setLastJob: (job) => set({ lastJobId: job.id, lastJobInstanceId: (job as { vast_instance_id?: string }).vast_instance_id ?? null, jobStatus: job.status }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setResults: (outputs) => set({ results: outputs, jobOutputs: outputs }),
  setJobOutputs: (outputs) => set({ jobOutputs: outputs, results: outputs }),
  setRestoredWork: (v) => set({ restoredWork: v }),

  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setUser: (user) => set({ user }),
}))
export default useAppStore
