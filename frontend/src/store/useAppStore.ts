import { create } from 'zustand'
import { toServerPayload } from '../utils/blockHelpers'
import type { InternalCatalog } from '../types/catalog'
import type { PipelineNode, PipelineEdge, Job, JobOutput, JobStatus } from '../types/catalog'
import { createPipeline, updatePipeline } from '../api/client'
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'
import { applyNodeChanges, applyEdgeChanges, addEdge, type Connection } from 'reactflow'
import { COL_W, COL_PAD, ROW_H, FALLBACK_H, HEADER_H, hasGridPos, posFor, pruneInvalidEdges, snapPosition, colOf, rowOf, migrateToGrid, type GridColumn } from '../utils/gridLayout'

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

/** Snapshot d'undo/redo : état sémantique du pipeline (ReactFlow direct —
    les métadonnées temporaires sont recalculées au restore). */
export type UndoSnapshot = { nodes: Node[]; edges: Edge[]; name: string; columns: GridColumn[] }

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

  undoStack: UndoSnapshot[]
  redoStack: UndoSnapshot[]

  viewMode: 'free' | 'grid'
  selectedCol: string | null
  columns: GridColumn[]
  columnCounter: number

  setUser: (user: unknown | null) => void
  setCategory: (id: string) => void
  setViewMode: (mode: 'free' | 'grid') => void
  setSelectedCol: (id: string | null) => void
  addColumn: () => void
  renameColumn: (id: string, label: string) => void
  duplicateColumn: (id: string) => void
  removeColumn: (id: string) => boolean
  moveColumnTo: (id: string, targetIndex: number) => void
  moveNodeTo: (nodeId: string, col: number, row: number) => void
  reflow: () => void
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
  commitUndoPoint: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  isDirty: () => boolean
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[], pipelineId: string, name: string, columns?: GridColumn[]) => void
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
export function fingerprintOf(s: { flowNodes: Node[]; flowEdges: Edge[]; projectName: string; columns: GridColumn[] }): string {
  return JSON.stringify({
    nodes: s.flowNodes.map(n => {
      const p = n.position as { col?: number; row?: number }
      return {
        id: n.id,
        type: (n.data as { type?: string } | undefined)?.type,
        fields: (n.data as { fields?: Record<string, string> } | undefined)?.fields,
        segs: (n.data as { segs?: unknown } | undefined)?.segs,
        // En mode grille la position x/y est dérivée de col/row : seul col/row
        // compte (stable pendant le drag). En mode libre, la position libre.
        position: p.col !== undefined && p.row !== undefined ? { col: p.col, row: p.row } : n.position,
      }
    }),
    edges: s.flowEdges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    columns: s.columns,
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
  savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle', columns: [] }),
  restoredWork: false,
  toast: null,
  undoStack: [],
  redoStack: [],
  viewMode: (typeof localStorage !== 'undefined' && localStorage.getItem('mlb-view-mode') === 'grid') ? 'grid' : 'free',
  selectedCol: null,
  columns: [],
  columnCounter: 0,

  setCategory: (id) => set({ category: id }),

  setViewMode: (mode) => {
    try { localStorage.setItem('mlb-view-mode', mode) } catch { /* privé — ignoré */ }
    const s = get()
    if (s.viewMode === mode) return
    if (mode === 'grid') {
      const flowNodes = migrateToGrid(s.flowNodes, s.flowEdges)
      if (s.columns.length > 0) {
        set({ viewMode: mode, flowNodes })
      } else {
        set({ viewMode: mode, flowNodes, columns: [{ id: 'c0', label: '0' }], columnCounter: 1 })
      }
      // Génère les colonnes nécessaires (0..maxCol) et empile les blocs
      // (packing par hauteurs mesurées) — sans ça, les projets existants
      // ouverts en vue libre restaient sur une seule colonne au switch.
      get().reflow()
      return
    }
    set({ viewMode: mode })
  },
  setSelectedCol: (id) => set({ selectedCol: id }),

  addColumn: () => set((s) => ({
    columns: [...s.columns, { id: `c${Date.now()}`, label: String(s.columnCounter) }],
    columnCounter: s.columnCounter + 1,
  })),

  renameColumn: (id, label) => set((s) => ({
    columns: s.columns.map(c => (c.id === id ? { ...c, label } : c)),
  })),

  duplicateColumn: (id) => {
    const s = get()
    const idx = s.columns.findIndex(c => c.id === id)
    if (idx < 0) return
    const col = s.columns[idx]
    const newId = `c${Date.now()}`
    // Copie des blocs de la colonne : ids neufs, params copiés, AUCUN lien.
    // Les clones sont placés dans la NOUVELLE colonne (idx + 1), même rangée.
    const clones = s.flowNodes
      .filter(n => colOf(n) === idx)
      .map(n => ({
        ...n,
        id: `${n.id}_${Date.now()}`,
        position: posFor(idx + 1, rowOf(n)),
      }))
    set({
      columns: [...s.columns.slice(0, idx + 1), { id: newId, label: `${col.label} (copie)` }, ...s.columns.slice(idx + 1)],
      flowNodes: [...s.flowNodes, ...clones],
    })
    if (get().viewMode === 'grid') get().reflow()
  },

  removeColumn: (id) => {
    const s = get()
    const idx = s.columns.findIndex(c => c.id === id)
    if (idx < 0) return false
    // Refus si la colonne contient des blocs (message côté UI).
    if (s.flowNodes.some(n => colOf(n) === idx)) return false
    const columns = s.columns.filter(c => c.id !== id)
    const flowNodes = s.flowNodes.map(n => {
      const c = colOf(n)
      if (c <= idx) return n
      return { ...n, position: posFor(c - 1, rowOf(n)) }
    })
    set({ columns, flowNodes, selectedCol: s.selectedCol === id ? null : s.selectedCol })
    return true
  },

  moveColumnTo: (id, targetIndex) => {
    const s = get()
    const from = s.columns.findIndex(c => c.id === id)
    if (from < 0 || targetIndex < 0 || targetIndex >= s.columns.length || targetIndex === from) return
    s.commitUndoPoint()
    const columns = [...s.columns]
    const [moved] = columns.splice(from, 1)
    columns.splice(targetIndex, 0, moved)
    // Recalcule la colonne de chaque bloc (la déplacée + le décalage des autres).
    const flowNodes = s.flowNodes.map(n => {
      const c = colOf(n)
      let nc = c
      if (c === from) nc = targetIndex
      else if (from < targetIndex && c > from && c <= targetIndex) nc = c - 1
      else if (from > targetIndex && c >= targetIndex && c < from) nc = c + 1
      return nc === c ? n : { ...n, position: posFor(nc, rowOf(n)) }
    })
    const [flowEdges, removed] = pruneInvalidEdges(flowNodes, s.flowEdges)
    set({ columns, flowNodes, flowEdges })
    if (removed > 0) get().showToast({ kind: 'error', message: `${removed} lien(s) retiré(s) — Ctrl+Z pour annuler` })
    if (get().viewMode === 'grid') get().reflow()
  },

  moveNodeTo: (nodeId, col, row) => {
    const s = get()
    const node = s.flowNodes.find(n => n.id === nodeId)
    if (!node) return
    const cur = colOf(node)
    const curRow = rowOf(node)
    if (cur === col && curRow === row) {
      // Même cellule : ré-aligne juste x/y (le drag a laissé une position
      // flottante) — pas de commit, pas de dirty (le fingerprint ignore x/y).
      set({ flowNodes: s.flowNodes.map(n => (n.id === nodeId ? { ...n, position: posFor(col, row) } : n)) })
      return
    }
    // Commit avec position RÉTABLIE sur l'ancienne cellule : le snapshot
    // d'undo ne doit pas contenir la position flottante de fin de drag.
    const pre = s.flowNodes.map(n =>
      n.id === nodeId && hasGridPos(n) ? { ...n, position: posFor(colOf(n), rowOf(n)) } : n
    )
    set({
      undoStack: [...s.undoStack.slice(-49), { nodes: pre, edges: s.flowEdges, name: s.projectName, columns: s.columns }],
      redoStack: [],
    })
    const flowNodes = s.flowNodes.map(n => (n.id === nodeId ? { ...n, position: posFor(col, row) } : n))
    const [flowEdges, removed] = pruneInvalidEdges(flowNodes, s.flowEdges)
    set({ flowNodes, flowEdges })
    if (removed > 0) get().showToast({ kind: 'error', message: `${removed} lien(s) retiré(s) — Ctrl+Z pour annuler` })
    if (get().viewMode === 'grid') get().reflow()
  },

  reflow: () => set((s) => {
    if (s.viewMode !== 'grid') return {}
    // 1. Génère les colonnes nécessaires aux blocs (0..maxCol) — labels auto.
    let maxCol = -1
    for (const n of s.flowNodes) {
      const c = colOf(n)
      if (c > maxCol) maxCol = c
    }
    let columns = s.columns
    let columnCounter = s.columnCounter
    if (maxCol >= columns.length) {
      const add: GridColumn[] = []
      for (let i = columns.length; i <= maxCol; i++) {
        add.push({ id: `c${Date.now()}_${i}`, label: String(columnCounter++) })
      }
      columns = [...columns, ...add]
    }
    // 2. Packing vertical : blocs empilés selon leur hauteur mesurée (les
    //    colonnes épousent leur contenu).
    const groups = new Map<number, Node[]>()
    for (const n of s.flowNodes) {
      const c = colOf(n)
      const list = groups.get(c) ?? []
      list.push(n)
      groups.set(c, list)
    }
    const out: Node[] = []
    for (const [c, list] of groups) {
      const sorted = [...list].sort((a, b) => rowOf(a) - rowOf(b))
      let y = HEADER_H + COL_PAD
      for (const n of sorted) {
        const h = (n.height as number | undefined) ?? FALLBACK_H
        out.push({ ...n, position: { ...posFor(c, rowOf(n)), y } })
        y += h + COL_PAD
      }
    }
    return { flowNodes: out, columns, columnCounter }
  }),

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
    if (get().viewMode === 'grid') get().reflow()
  },

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

  clearAll: () => set({ flowNodes: [], flowEdges: [], consoleLines: [], result: null, running: false, runningId: null, lastJobId: null, jobStatus: null, results: [], columns: [], selectedCol: null, columnCounter: 0 }),

  setCatalog: (catalog) => set((s) => {
    const firstCat = catalog.categories[0]?.id ?? 'data'
    const catExists = catalog.categories.some(c => c.id === s.category)
    // Pipeline chargé avant le catalogue (ouverture depuis /projets) :
    // enrichit les nodes avec segs/inputs/outputs une fois le catalogue dispo.
    let flowNodes = s.flowNodes
    let savedFingerprint = s.savedFingerprint
    // ![] est false en JS : vérifier la LONGUEUR (un nœud chargé sans catalogue
    // a segs=[] — il DOIT être backfillé, sinon le bloc reste sans champs).
    const needsBackfill = flowNodes.length > 0 && flowNodes.some(n => !((n.data as { segs?: unknown[] } | undefined)?.segs?.length))
    if (needsBackfill) {
      flowNodes = flowNodes.map(n => {
        const d = n.data as { type?: string; fields?: Record<string, string>; segs?: unknown[] } | undefined
        // Piège ![] : un array VIDE est truthy en JS — vérifier la LONGUEUR,
        // sinon les nœuds chargés sans catalogue (segs=[]) ne sont jamais backfillés.
        if (d?.segs?.length) return n
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
      savedFingerprint = fingerprintOf({ flowNodes, flowEdges: s.flowEdges, projectName: s.projectName, columns: s.columns })
    }
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
    undoStack: [...s.undoStack.slice(-49), { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName, columns: s.columns }],
    redoStack: [],
  })),
  undo: () => {
    const s = get()
    if (!s.undoStack.length) return
    const snap = s.undoStack[s.undoStack.length - 1]
    set({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName, columns: s.columns }],
      flowNodes: snap.nodes,
      flowEdges: snap.edges,
      projectName: snap.name,
      columns: snap.columns,
    })
  },
  redo: () => {
    const s = get()
    if (!s.redoStack.length) return
    const snap = s.redoStack[s.redoStack.length - 1]
    set({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, { nodes: s.flowNodes, edges: s.flowEdges, name: s.projectName, columns: s.columns }],
      flowNodes: snap.nodes,
      flowEdges: snap.edges,
      projectName: snap.name,
      columns: snap.columns,
    })
  },
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  isDirty: () => {
    const s = get()
    if (s.savedFingerprint === null) return false
    return fingerprintOf(s) !== s.savedFingerprint
  },

  loadPipeline: (nodes, edges, pipelineId, name, columns) => {
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
    const cols: GridColumn[] = columns && columns.length > 0 ? columns : [{ id: 'c0', label: '0' }]
    const counter = cols.reduce((m, c) => {
      const n = Number.parseInt(c.label, 10)
      return Number.isFinite(n) && n + 1 > m ? n + 1 : m
    }, 0)
    // Si la vue grille est la préférence active, migre les positions à la volée
    // (col = niveau topologique, row = rang) et génère les colonnes via reflow.
    const finalNodes = s.viewMode === 'grid' ? migrateToGrid(flowNodes, flowEdges) : flowNodes
    set({
      flowNodes: finalNodes,
      flowEdges,
      pipelineId,
      projectName: name,
      columns: cols,
      columnCounter: counter,
      selectedCol: null,
      savedFingerprint: fingerprintOf({ flowNodes: finalNodes, flowEdges, projectName: name, columns: cols }),
      undoStack: [],
      redoStack: [],
    })
    if (s.viewMode === 'grid') get().reflow()
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
      savedFingerprint: fingerprintOf({ flowNodes: s.flowNodes, flowEdges: s.flowEdges, projectName: detail.name, columns: s.columns }),
    })
  },

  ensureDraft: async () => {
    const s = get()
    if (s.pipelineId !== null) return s.pipelineId
    const { nodes, edges } = toServerPayload(s)
    const created = await createPipeline({ name: 'mon-premier-modèle', description: '', is_draft: true, nodes, edges, columns: s.columns })
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
