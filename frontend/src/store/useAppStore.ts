import { create } from 'zustand'
import { toServerPayload } from '../utils/blockHelpers'
import type { InternalCatalog } from '../types/catalog'
import type { PipelineNode, PipelineEdge, Job, JobOutput, JobStatus } from '../types/catalog'
import { createPipeline, updatePipeline } from '../api/client'
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'
import { applyNodeChanges, applyEdgeChanges, addEdge, type Connection } from 'reactflow'

export type ConsoleLine = { k: string; t: string }

export type Toast = {
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

export type DragState = DragBase & { source: 'palette' }

type AppState = {
  category: string
  user: unknown | null
  flowNodes: Node[]
  flowEdges: Edge[]
  running: boolean
  runningId: string | null
  consoleLines: ConsoleLine[]
  result: unknown
  drag: DragState | null
  catalog: InternalCatalog | null
  catalogError: boolean
  catalogErrorMessage: string | null
  pipelineId: string | null
  projectName: string
  lastJobId: string | null
  jobStatus: JobStatus | null
  results: JobOutput[]
  savedFingerprint: string | null
  restoredWork: boolean
  toast: Toast | null

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
  startRun: () => void
  setRunningId: (id: string | null) => void
  finishRun: (result: unknown) => void
  stopRun: () => void
  failRun: () => void
  clearAll: () => void
  setCatalog: (catalog: InternalCatalog) => void
  setCatalogError: (error: boolean, message?: string) => void
  setPipelineId: (id: string | null) => void
  setProjectName: (name: string) => void
  isDirty: () => boolean
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[], pipelineId: string, name: string) => void
  savePipeline: (name: string) => Promise<void>
  ensureDraft: () => Promise<string>
  setLastJob: (job: Job) => void
  setJobStatus: (status: JobStatus | null) => void
  setResults: (outputs: JobOutput[]) => void
  setRestoredWork: (v: boolean) => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}


/** Empreinte du canvas : données sémantiques uniquement — les métadonnées
    ReactFlow (measured, selected, dragging…) sont volatiles et ne doivent pas
    rendre le projet "modifié". */
export function fingerprintOf(s: { flowNodes: Node[]; flowEdges: Edge[]; projectName: string }): string {
  return JSON.stringify({
    nodes: s.flowNodes.map(n => ({
      id: n.id,
      type: (n.data as { type?: string } | undefined)?.type,
      fields: (n.data as { fields?: Record<string, string> } | undefined)?.fields,
      segs: (n.data as { segs?: unknown } | undefined)?.segs,
      position: n.position,
    })),
    edges: s.flowEdges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    projectName: s.projectName,
  })
}

const useAppStore = create<AppState>((set, get) => ({
  category: 'data',
  flowNodes: [],
  flowEdges: [],
  running: false,
  runningId: null,
  consoleLines: [],
  result: null,
  drag: null,
  user: null,
  catalog: null,
  catalogError: false,
  catalogErrorMessage: null,
  pipelineId: null,
  projectName: 'mon-premier-modèle',
  lastJobId: null,
  jobStatus: null,
  results: [],
  savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle' }),
  restoredWork: false,
  toast: null,

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
  removeFlowNode: (nodeId) => set((s) => ({
    flowNodes: s.flowNodes.filter(n => n.id !== nodeId),
    flowEdges: s.flowEdges.filter(e => e.source !== nodeId && e.target !== nodeId),
  })),

  setDrag: (drag) => set({ drag }),
  clearDrag: () => set({ drag: null }),

  appendConsoleLines: (lines) => set((s) => ({ consoleLines: [...s.consoleLines, ...lines] })),

  startRun: () => set({
    running: true,
    runningId: null,
    consoleLines: [{ k: 'sys', t: "C'est parti !" }],
    result: null,
  }),

  setRunningId: (id) => set({ runningId: id }),

  finishRun: (result) => set((s) => ({
    running: false,
    runningId: null,
    result,
    consoleLines: [...s.consoleLines, { k: 'ok', t: 'Terminé' }],
  })),

  stopRun: () => set((s) => ({
    running: false,
    runningId: null,
    consoleLines: [...s.consoleLines, { k: 'sys', t: 'Arrêté' }],
  })),

  failRun: () => set((s) => ({ running: false, runningId: null })),

  clearAll: () => set({ flowNodes: [], flowEdges: [], consoleLines: [], result: null, running: false, runningId: null, lastJobId: null, jobStatus: null, results: [] }),

  setCatalog: (catalog) => set((s) => {
    const firstCat = catalog.categories[0]?.id ?? 'data'
    const catExists = catalog.categories.some(c => c.id === s.category)
    // Pipeline chargé avant le catalogue (ouverture depuis /projets) :
    // enrichit les nodes avec segs/inputs/outputs une fois le catalogue dispo.
    let flowNodes = s.flowNodes
    let savedFingerprint = s.savedFingerprint
    const needsBackfill = flowNodes.length > 0 && flowNodes.some(n => !(n.data as { segs?: unknown } | undefined)?.segs)
    if (needsBackfill) {
      flowNodes = flowNodes.map(n => {
        const d = n.data as { type?: string; fields?: Record<string, string>; segs?: unknown } | undefined
        if (d?.segs) return n
        const def = d?.type ? catalog.blocks[d.type] : undefined
        const first = def?.segs[0]
        return {
          ...n,
          data: {
            type: d?.type ?? '',
            label: first?.t === 'text' ? first.v : (d?.type ?? ''),
            category: def?.cat ?? 'unknown',
            categoryColor: catalog.categories.find(c => c.id === def?.cat)?.color ?? '#888',
            segs: def?.segs ?? [],
            fields: d?.fields ?? {},
            inputs: def?.inputs ?? [],
            outputs: def?.outputs ?? [],
          },
        }
      })
      savedFingerprint = fingerprintOf({ flowNodes, flowEdges: s.flowEdges, projectName: s.projectName })
    }
    return { catalog, category: catExists ? s.category : firstCat, flowNodes, savedFingerprint }
  }),

  setCatalogError: (error, message) => set({
    catalogError: error,
    catalogErrorMessage: message ?? null,
  }),

  setPipelineId: (id) => set({ pipelineId: id }),
  setProjectName: (name) => set({ projectName: name }),

  isDirty: () => {
    const s = get()
    if (s.savedFingerprint === null) return false
    return fingerprintOf(s) !== s.savedFingerprint
  },

  loadPipeline: (nodes, edges, pipelineId, name) => set((s) => {
    // Construction directe des nodes flow depuis le JSON serveur. Sans
    // catalogue, les segs/inputs/outputs sont vides — le backfill setCatalog
    // les enrichit à l'arrivée du catalogue.
    const flowNodes: Node[] = nodes.map((n, i) => {
      const def = s.catalog?.blocks[n.type]
      const first = def?.segs[0]
      return {
        id: n.id,
        type: 'block',
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
    return { flowNodes, flowEdges, pipelineId, projectName: name, savedFingerprint: fingerprintOf({ flowNodes, flowEdges, projectName: name }) }
  }),

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

  setLastJob: (job) => set({ lastJobId: job.id, jobStatus: job.status }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setResults: (outputs) => set({ results: outputs }),
  setRestoredWork: (v) => set({ restoredWork: v }),

  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setUser: (user) => set({ user }),
}))

export default useAppStore
