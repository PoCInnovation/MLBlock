import { create } from 'zustand'
import { instantiate, toServerPayload } from '../utils/blockHelpers'
import type { Block } from '../utils/blockHelpers'
import type { InternalCatalog } from '../types/catalog'
import type { PipelineNode, PipelineEdge, Job, JobOutput, JobStatus } from '../types/catalog'
import { createPipeline, updatePipeline } from '../api/client'
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'
import { applyNodeChanges, applyEdgeChanges, addEdge, type Connection } from 'reactflow'
import { linearToFlow, flowToLinear } from '../utils/flowConversion'
import type { FlowBlock } from '../utils/flowConversion'

export type ConsoleLine = { k: string; t: string }

export type Toast = {
  kind: 'error' | 'convert'
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

export type DragState =
  | (DragBase & { source: 'palette' })
  | (DragBase & { source: 'script'; id: string })

type AppState = {
  editorMode: 'linear' | 'advanced'
  category: string
  user: unknown | null
  script: Block[]
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
  pipelineId: number | null
  projectName: string
  lastJobId: number | null
  jobStatus: JobStatus | null
  results: JobOutput[]
  toast: Toast | null

  setUser: (user: unknown | null) => void
  setEditorMode: (mode: 'linear' | 'advanced') => void
  setCategory: (id: string) => void
  addBlock: (type: string, index: number | null) => void
  deleteBlock: (id: string) => void
  moveBlock: (id: string, index: number) => void
  updateField: (id: string, k: string, v: string) => void
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
  setPipelineId: (id: number | null) => void
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[], pipelineId: number, name: string) => void
  savePipeline: (name: string) => Promise<void>
  ensureDraft: () => Promise<number>
  setLastJob: (job: Job) => void
  setJobStatus: (status: JobStatus | null) => void
  setResults: (outputs: JobOutput[]) => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}

const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('mlblock-editor-mode') : null

const useAppStore = create<AppState>((set, get) => ({
  editorMode: savedMode === 'advanced' ? 'advanced' : 'linear',
  category: 'data',
  script: [],
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
  toast: null,

  setCategory: (id) => set({ category: id }),

  setEditorMode: (mode) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('mlblock-editor-mode', mode)
    set((s) => {
    if (mode === 'advanced' && s.catalog) {
      const flowNodes = linearToFlow(s.script as FlowBlock[], s.catalog)
      return { editorMode: mode, flowNodes }
    }
    if (mode === 'linear') {
      const script = flowToLinear(s.flowNodes)
      return { editorMode: mode, script: script as any }
    }
    return { editorMode: mode }
  })
  },

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

  addBlock: (type, index) => set((s) => {
    if (!s.catalog) return {}
    const b = instantiate(type, s.catalog.blocks)
    const sc = s.script.slice()
    if (index == null || index < 0 || index > sc.length) sc.push(b)
    else sc.splice(index, 0, b)
    return { script: sc }
  }),

  deleteBlock: (id) => set((s) => ({ script: s.script.filter(b => b.id !== id) })),

  moveBlock: (id, index) => set((s) => {
    const sc = s.script.slice()
    const from = sc.findIndex(b => b.id === id)
    if (from < 0) return {}
    const [b] = sc.splice(from, 1)
    let idx = from < index ? index - 1 : index
    idx = Math.max(0, Math.min(idx, sc.length))
    sc.splice(idx, 0, b)
    return { script: sc }
  }),

  updateField: (id, k, v) => set((s) => ({
    script: s.script.map(b => b.id === id ? { ...b, fields: { ...b.fields, [k]: v } } : b)
  })),

  setDrag: (drag) => set({ drag }),
  clearDrag: () => set({ drag: null }),

  appendConsoleLines: (lines) => set((s) => ({ consoleLines: [...s.consoleLines, ...lines] })),

  startRun: () => set({
    running: true,
    runningId: null,
    consoleLines: [{ k: 'sys', t: `▶ C'est parti !` }],
    result: null,
  }),

  setRunningId: (id) => set({ runningId: id }),

  finishRun: (result) => set((s) => ({
    running: false,
    runningId: null,
    result,
    consoleLines: [...s.consoleLines, { k: 'ok', t: '✓ Terminé' }],
  })),

  stopRun: () => set((s) => ({
    running: false,
    runningId: null,
    consoleLines: [...s.consoleLines, { k: 'sys', t: '■ Arrêté' }],
  })),

  failRun: () => set((s) => ({ running: false, runningId: null })),

  clearAll: () => set({ script: [], flowNodes: [], flowEdges: [], consoleLines: [], result: null, running: false, runningId: null, lastJobId: null, jobStatus: null, results: [] }),

  setCatalog: (catalog) => set((s) => {
    const firstCat = catalog.categories[0]?.id ?? 'data'
    const catExists = catalog.categories.some(c => c.id === s.category)
    // Pipeline chargé avant le catalogue (ouverture depuis /projets) :
    // reconversion one-shot du script vers le canvas avancé.
    let flowNodes = s.flowNodes
    if (s.script.length > 0 && s.flowNodes.length === 0) {
      flowNodes = linearToFlow(s.script as FlowBlock[], catalog)
    }
    return { catalog, category: catExists ? s.category : firstCat, flowNodes }
  }),

  setCatalogError: (error, message) => set({
    catalogError: error,
    catalogErrorMessage: message ?? null,
  }),

  setPipelineId: (id) => set({ pipelineId: id }),

  loadPipeline: (nodes, edges, pipelineId, name) => set((s) => {
    const script: Block[] = nodes.map(n => ({
      id: n.id,
      type: n.type,
      fields: Object.fromEntries(Object.entries(n.params ?? {}).map(([k, v]) => [k, String(v)])),
    }))
    const flowNodes = s.catalog ? linearToFlow(script as FlowBlock[], s.catalog) : []
    const posMap = new Map<string, { x: number; y: number }>()
    nodes.forEach(n => { if (n.position) posMap.set(n.id, n.position) })
    const positioned = flowNodes.map(n => (posMap.has(n.id) ? { ...n, position: posMap.get(n.id)! } : n))
    const flowEdges: Edge[] = edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      sourceHandle: e.source_port,
      target: e.target,
      targetHandle: e.target_port,
    }))
    return { script, flowNodes: positioned, flowEdges, pipelineId, projectName: name }
  }),

  savePipeline: async (name) => {
    const s = get()
    const payload = toServerPayload(s)
    const body = { name, description: '', is_draft: false, ...payload }
    const detail = s.pipelineId === null
      ? await createPipeline(body)
      : await updatePipeline(s.pipelineId, body)
    set({ pipelineId: detail.id, projectName: detail.name })
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

  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setUser: (user) => set({ user }),
}))

export default useAppStore
