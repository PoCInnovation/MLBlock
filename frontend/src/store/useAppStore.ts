import { create } from 'zustand'
import { instantiate, defaultScript } from '../utils/blockHelpers'
import type { Block } from '../utils/blockHelpers'

export type ConsoleLine = { k: string; t: string }

export type DragState = {
  active: boolean
  source: 'palette' | 'script'
  type: string
  id?: string
  sx: number; sy: number
  x: number;  y: number
  insertIndex: number
  overCanvas: boolean
  moved: boolean
  color: string
  label: string
}

type AppState = {
  screen: 'home' | 'build'
  category: string
  script: Block[]
  running: boolean
  runningId: string | null
  consoleLines: ConsoleLine[]
  result: { acc: string } | null
  drag: DragState | null

  goBuild: () => void
  goHome: () => void
  setCategory: (id: string) => void
  addBlock: (type: string, index: number | null) => void
  deleteBlock: (id: string) => void
  moveBlock: (id: string, index: number) => void
  updateField: (id: string, k: string, v: string) => void
  setDrag: (drag: DragState) => void
  clearDrag: () => void
  appendConsoleLines: (lines: ConsoleLine[]) => void
  startRun: () => void
  setRunningId: (id: string | null) => void
  finishRun: (acc: string) => void
  stopRun: () => void
  clearAll: () => void
}

const useAppStore = create<AppState>((set) => ({
  screen: 'home',
  category: 'data',
  script: defaultScript(),
  running: false,
  runningId: null,
  consoleLines: [],
  result: null,
  drag: null,

  goBuild: () => set({ screen: 'build' }),
  goHome: () => set({ screen: 'home' }),
  setCategory: (id) => set({ category: id }),

  addBlock: (type, index) => set((s) => {
    const b = instantiate(type)
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

  finishRun: (acc) => set((s) => ({
    running: false,
    runningId: null,
    result: { acc },
    consoleLines: [...s.consoleLines, { k: 'ok', t: `✓ Terminé — ton modèle a une précision de ${acc}%` }],
  })),

  stopRun: () => set((s) => ({
    running: false,
    runningId: null,
    consoleLines: [...s.consoleLines, { k: 'sys', t: '■ Arrêté' }],
  })),

  clearAll: () => set({ script: [], consoleLines: [], result: null, running: false, runningId: null }),
}))

export default useAppStore
