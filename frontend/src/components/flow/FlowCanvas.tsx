import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AlignVerticalJustifyCenter, Menu, PanelLeft, PanelRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { IconButton, ToggleButtonGroup, ToggleButton, TextInput, Grid, ClickableCard, Button, Divider, Switch, HStack } from '@astryxdesign/core'
import { Markdown } from '@astryxdesign/core'
import { courses, getCourse } from '../../content/cours'
import BlockNode from './BlockNode'
import FlowLink from './FlowLink'
import FlowPalette from './FlowPalette'
import { segsToFields } from '../../utils/flowConversion'
import { buildConversionGraph, classifyEdge, converterFor, portDtype } from '../../utils/typeCheck'
import { resolveConnection, type ResolvedConnection } from '../../utils/portResolution'
import { arrangeGraph } from '../../utils/layout'
import type { Port } from '../../types/catalog'
const nodeTypes = { block: BlockNode }
const edgeTypes = { flow: FlowLink }

const reactFlowStyle: React.CSSProperties = {
  background: theme.color.canvas,
  borderRadius: 20,
}

const edgeColor: Record<string, string> = {
  compatible: theme.color.success,
  convertible: theme.color.convert,
  incompatible: theme.color.error,
}
/** Ports of a flow node (xyflow Node data is untyped `Record<string, unknown>`). */
function portList(node: Node | undefined, side: 'inputs' | 'outputs'): Port[] | undefined {
  const data = node?.data as Record<string, unknown> | undefined
  const v = data?.[side]
  return Array.isArray(v) ? (v as Port[]) : undefined
}

function edgeStyleFor(e: Edge, nodes: Node[], graph: Map<string, Set<string>>): React.CSSProperties {
  const src = nodes.find(n => n.id === e.source)
  const tgt = nodes.find(n => n.id === e.target)
  const srcDtype = portDtype(portList(src, 'outputs'), e.sourceHandle)
  const tgtDtype = portDtype(portList(tgt, 'inputs'), e.targetHandle)
  if (!srcDtype || !tgtDtype) return {}
  const verdict = classifyEdge(srcDtype, tgtDtype, graph)
  return {
    stroke: edgeColor[verdict],
    strokeDasharray: verdict === 'convertible' ? '6 4' : undefined,
  }
}

const FlowCanvasInner = React.memo(function FlowCanvasInner() {
  // Single source of truth: the store. No local canvas state, no sync effects.
  const { flowNodes, flowEdges } = useAppStore(useShallow(s => ({
    flowNodes: s.flowNodes,
    flowEdges: s.flowEdges,
  })))
  const addFlowNode = useAppStore(s => s.addFlowNode)
  const addFlowEdges = useAppStore(s => s.addFlowEdges)
  const catalog = useAppStore(s => s.catalog)
  const showToast = useAppStore(s => s.showToast)

  const { screenToFlowPosition, fitView, getZoom } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Timer du fitView post-dispose : annulé au démontage pour ne pas appeler
  // fitView sur une instance ReactFlow démontée.
  const fitViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tiroir palette mobile (overlay) — desktop : jamais ouvert, bouton caché.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [rightMode, setRightMode] = useState<'cours' | 'inspecteur'>('inspecteur')
  const hasOutputs = useAppStore(s => s.results.length > 0)
  // Compteur de taps : décale les ajouts successifs pour éviter l'empilement
  // exact au centre (le premier reste centré).
  const tapSeq = useRef(0)
  const paletteToggleRef = useRef<HTMLButtonElement>(null)
  const paletteDrawerRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)
  useEffect(() => {
    return () => {
      if (fitViewTimerRef.current) clearTimeout(fitViewTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!paletteOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPaletteOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen])

  // Focus : dans le tiroir à l'ouverture, retour au bouton à la fermeture.
  useEffect(() => {
    if (paletteOpen) {
      wasOpenRef.current = true
      paletteDrawerRef.current?.focus()
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false
      paletteToggleRef.current?.focus()
    }
  }, [paletteOpen])

  const graph = useMemo(
    () => (catalog ? buildConversionGraph(catalog.blocks) : new Map<string, Set<string>>()),
    [catalog]
  )

  /** Construit un nœud bloc — partagé entre drop (DnD) et tap-to-add. */
  const buildNode = useCallback((type: string, position: { x: number; y: number }): Node | null => {
    if (!catalog) return null
    const def = catalog.blocks[type]
    if (!def) return null
    const cat = catalog.categories.find(c => c.id === def.cat)
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    return {
      id: `${type}_${Date.now()}`,
      type: 'block',
      dragHandle: '.block-drag-handle',
      position,
      data: {
        type,
        label,
        category: def.cat,
        categoryColor: cat?.color ?? theme.color.accent,
        segs: def.segs,
        fields: segsToFields(def),
        inputs: def.inputs,
        outputs: def.outputs,
      },
    }
  }, [catalog])

  const insertConverter = useCallback((conn: Connection, convType: string, resolved: ResolvedConnection) => {
    useAppStore.getState().commitUndoPoint()
    const { flowNodes, flowEdges } = useAppStore.getState()
    if (!catalog) return
    const def = catalog.blocks[convType]
    if (!def) return
    const convIn = def.inputs[0]?.name ?? 'in_1'
    const convOut = def.outputs[0]?.name ?? 'out_1'
    const srcPos = flowNodes.find(n => n.id === conn.source)?.position
    const tgtPos = flowNodes.find(n => n.id === conn.target)?.position
    const position = srcPos && tgtPos
      ? { x: (srcPos.x + tgtPos.x) / 2, y: (srcPos.y + tgtPos.y) / 2 }
      : { x: 300, y: 300 }
    const convId = `${convType}_${Date.now()}`
    const cat = catalog.categories.find(c => c.id === def.cat)
    const node: Node = {
      id: convId,
      type: 'block',
      dragHandle: '.block-drag-handle',
      position,
      data: {
        type: convType,
        label: def.segs.find(s => s.t === 'text')?.v ?? convType,
        category: def.cat,
        categoryColor: cat?.color ?? theme.color.accent,
        segs: def.segs,
        fields: segsToFields(def),
        inputs: def.inputs,
        outputs: def.outputs,
      },
    }
    // Câblage avec les ports résolus (sourcePort de A, targetPort de B) :
    // les handles cliqués ne sont pas fiables côté non-ambigu (point unique).
    const edgeA: Edge = {
      id: `e_${conn.source}_${convId}`,
      source: conn.source ?? '',
      sourceHandle: resolved.sourcePort,
      target: convId,
      targetHandle: convIn,
    }
    const edgeB: Edge = {
      id: `e_${convId}_${conn.target}`,
      source: convId,
      sourceHandle: convOut,
      target: conn.target ?? '',
      targetHandle: resolved.targetPort,
    }
    addFlowNode(node)
    addFlowEdges(flowEdges.filter(ed => !(ed.source === conn.source && ed.target === conn.target)).concat([edgeA, edgeB]))
  }, [catalog, addFlowNode, addFlowEdges])

  // Undo/redo : snapshot avant toute suppression (rafale = un seul appel
  // ReactFlow — le `some` évite de pousser plusieurs points par sélection).
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const s = useAppStore.getState()
    if (changes.some(c => c.type === 'remove')) s.commitUndoPoint()
    s.applyFlowNodeChanges(changes)
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const s = useAppStore.getState()
    if (changes.some(c => c.type === 'remove')) s.commitUndoPoint()
    s.applyFlowEdgeChanges(changes)
  }, [])

  const onConnect = useCallback((params: Connection) => {
    useAppStore.getState().commitUndoPoint()
    const { flowNodes, flowEdges } = useAppStore.getState()
    if (!catalog) {
      addFlowEdges(addEdge(params, []))
      return
    }
    const src = flowNodes.find(n => n.id === params.source)
    const tgt = flowNodes.find(n => n.id === params.target)
    const srcPorts = portList(src, 'outputs')
    const tgtPorts = portList(tgt, 'inputs')
    if (!src || !tgt || !srcPorts?.length || !tgtPorts?.length) {
      addFlowEdges(addEdge(params, []))
      return
    }
    // Résolution automatique du couple (source_port, target_port) : côté
    // non-ambigu le point unique représente tous les ports, le scoring
    // choisit le plus compatible. Côté ambigu le handle cliqué est figé.
    const resolved = resolveConnection(srcPorts, tgtPorts, params.sourceHandle, params.targetHandle, graph)
    if (!resolved) {
      const srcDtype = portDtype(srcPorts, params.sourceHandle)
      const tgtDtype = portDtype(tgtPorts, params.targetHandle)
      showToast({ kind: 'error', message: `${srcDtype} → ${tgtDtype} : aucune conversion possible` })
      return
    }
    if (resolved.verdict === 'compatible') {
      // Remplacement : un input n'a jamais qu'une edge — supprime l'ancienne
      // sur ce port avant d'ajouter la nouvelle (1 input = 1 edge max).
      const rest = flowEdges.filter(e => !(e.target === tgt.id && e.targetHandle === resolved.targetPort))
      addFlowEdges(rest.concat([{
        id: `e_${src.id}_${tgt.id}_${resolved.targetPort}`,
        source: src.id,
        sourceHandle: resolved.sourcePort,
        target: tgt.id,
        targetHandle: resolved.targetPort,
      }]))
    } else {
      const conv = converterFor(
        srcPorts.find(p => p.name === resolved.sourcePort)?.dtype ?? '',
        tgtPorts.find(p => p.name === resolved.targetPort)?.dtype ?? '',
        catalog.blocks,
      )
      if (!conv) {
        showToast({ kind: 'error', message: `chemin de conversion introuvable` })
        return
      }
      showToast({
        kind: 'convert',
        message: `conversion via ${conv}`,
        action: () => insertConverter(params, conv, resolved),
      })
    }
  }, [catalog, graph, addFlowEdges, showToast, insertConverter])

  const onDragStart = useCallback((e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/mlblock-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!catalog) return
      const type = e.dataTransfer.getData('application/mlblock-type')
      if (!type || !catalog.blocks[type]) return
      useAppStore.getState().commitUndoPoint()

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const node = buildNode(type, position)
      if (!node) return
      addFlowNode(node)
      // ponytail: fitView recenters on the dropped node — screenToFlowPosition
      // on an empty canvas (fitView scale ~0.1) yields enormous flow coords
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    },
    [catalog, screenToFlowPosition, buildNode, addFlowNode, fitView]
  )

  // Tap-to-add (mobile) : même construction que le drop, position = centre
  // du viewport visible (le rect du canvas, pas de la fenêtre). Les ajouts
  // successifs sont décalés de 22px en Y (cycles de 6) pour ne pas s'empiler
  // exactement au centre.
  const addNodeAtCenter = useCallback((type: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const position = screenToFlowPosition({ x, y: y + (tapSeq.current++ % 6) * 22 })
    const node = buildNode(type, position)
    if (!node) return
    useAppStore.getState().commitUndoPoint()
    addFlowNode(node)
    setPaletteOpen(false)
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
  }, [buildNode, screenToFlowPosition, addFlowNode, fitView])

  // Disposer : ré-arrangement hiérarchique EXPLICITE des nœuds (dagre) —
  // jamais automatique (ni au chargement, ni après chaque édition). Taille
  // lue dans le DOM au moment du clic (hauteurs variables : params/segments),
  // corrigée du zoom pour rester en coordonnées de flow ; snapshot d'undo
  // avant application pour que Ctrl+Z restaure les positions manuelles.
  const handleArrange = useCallback(() => {
    if (useAppStore.getState().flowNodes.length < 2) return // no-op silencieux
    // rAF : le DOM reflète le dernier rendu (édition d'un param puis clic
    // immédiat sur Disposer avant le re-render React).
    requestAnimationFrame(() => {
      const store = useAppStore.getState()
      if (store.flowNodes.length < 2) return
      const zoom = getZoom() || 1 // zoom 0 → division infinie → NaN
      // Lookup en une passe par data-id : un id avec guillemet/backslash
      // (ids serveur passés verbatim au chargement) ferait jeter
      // querySelector(selon template).
      const elById: Record<string, Element> = {}
      wrapperRef.current?.querySelectorAll('.react-flow__node').forEach(el => {
        const id = el.getAttribute('data-id')
        if (id) elById[id] = el
      })
      const nodes = store.flowNodes.map(n => {
        const rect = elById[n.id]?.getBoundingClientRect()
        // Fallback 220×140 si le DOM manque ou si le rect est dégénéré
        // (0×0 : display:none ou non encore disposé).
        const width = rect && rect.width > 0 ? rect.width / zoom : 220
        const height = rect && rect.height > 0 ? rect.height / zoom : 140
        return { id: n.id, width, height }
      })
      const edges = store.flowEdges.map(e => ({ source: e.source, target: e.target }))
      const positions = arrangeGraph(nodes, edges)
      // Graphe déjà disposé : aucun déplacement visible → pas de point d'undo
      // inutile. Tolérance 1px : le zoom fitView fait dériver les mesures
      // DOM de fractions de pixel entre deux clics — l'égalité stricte ne
      // déclencherait jamais le skip.
      if (store.flowNodes.every(n => {
        const p = positions[n.id]
        return Math.abs(n.position.x - p.x) < 1 && Math.abs(n.position.y - p.y) < 1
      })) return
      store.commitUndoPoint()
      store.setFlowNodes(store.flowNodes.map(n => ({ ...n, position: positions[n.id] })))
      fitViewTimerRef.current = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    })
  }, [getZoom, fitView])

  const renderEdges = useMemo(
    () => flowEdges.map(e => {
      const base = edgeStyleFor(e, flowNodes, graph)
      return { ...e, type: 'flow' as const, style: base }
    }),
    [flowEdges, flowNodes, graph]
  )

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', gap: 16, minWidth: 0, minHeight: 0, height: '100%' }}>
      {/* Palette gauche : bouton repli en haut à droite *dans* la sidebar, instant */}
      <div
        className="flow-palette"
        style={{
          width: leftCollapsed ? 48 : 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'none',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            display: leftCollapsed ? 'flex' : 'none',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <IconButton
            label="Ouvrir la palette"
            icon={<PanelRight size={16} />}
            variant="ghost"
            size="sm"
            onClick={() => setLeftCollapsed(false)}
          />
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: leftCollapsed ? 'none' : 'flex',
          }}
        >
          <FlowPalette onDragStart={onDragStart} onToggleCollapse={() => setLeftCollapsed(true)} />
        </div>
      </div>
      <div
        ref={wrapperRef}
        className="floating-panel floating-canvas"
        style={{
          flex: 1,
          alignSelf: 'stretch',
          height: 'auto',
          minHeight: 0,
          borderRadius: theme.radius.xl,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          minWidth: 0,
          position: 'relative',
        }}
      >
        <ReactFlow
          nodes={flowNodes}
          edges={renderEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          connectionRadius={40}
          edgeTypes={edgeTypes}
          style={reactFlowStyle}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls
            style={{
              borderRadius: theme.radius.xl,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,.12)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            className="floating-panel"
          >
            <ControlButton
              onClick={handleArrange}
              title="Disposer"
              aria-label="Disposer les blocs automatiquement"
              disabled={flowNodes.length < 2}
              style={{ color: '#1a192b' }}
            >
              <AlignVerticalJustifyCenter size={18} />
            </ControlButton>
          </Controls>
          <MiniMap
            style={{
              borderRadius: theme.radius.xl,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            }}
            className="floating-panel"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>
      {/* Inspector droit : bouton repli en haut à gauche *dans* la sidebar, instant */}
      <div
        style={{
          width: rightCollapsed ? 48 : 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'none',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            display: rightCollapsed ? 'flex' : 'none',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <IconButton
            label="Ouvrir inspecteur"
            icon={<PanelLeft size={16} />}
            variant="ghost"
            size="sm"
            onClick={() => setRightCollapsed(false)}
          />
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: rightCollapsed ? 'none' : 'flex',
          }}
        >
          <InspectorPanel
            onToggleCollapse={() => setRightCollapsed(true)}
            rightMode={rightMode}
            onChangeMode={v => {
              if (v) setRightMode(v as 'cours' | 'inspecteur')
            }}
            hasOutputs={hasOutputs}
          />
        </div>
      </div>
      <button
        ref={paletteToggleRef}
        className="palette-toggle"
        onClick={() => setPaletteOpen(true)}
        aria-label={paletteOpen ? 'Fermer les blocs' : 'Ouvrir les blocs'}
        aria-expanded={paletteOpen}
        aria-controls="flow-palette-drawer"
        title="Blocs"
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
          background: theme.color.surface3, color: theme.color.text,
          border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.md,
          cursor: 'pointer', boxShadow: theme.shadow.btn,
        }}
      >
        <Menu size={20} />
      </button>
      {/* Tiroir palette mobile : overlay fixe + backdrop (z 40/50 au-dessus
          des panes ReactFlow, sous les modals). */}
      {paletteOpen && (
        <>
          <div className="palette-backdrop" onClick={() => setPaletteOpen(false)} />
          <div
            ref={paletteDrawerRef}
            id="flow-palette-drawer"
            className="palette-drawer floating-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Palette de blocs"
            tabIndex={-1}
            style={{
              borderRadius: theme.radius.xl,
              boxShadow: '0 8px 32px rgba(0,0,0,.12)',
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            }}
          >
            <FlowPalette onDragStart={onDragStart} onAdd={addNodeAtCenter} onClose={() => setPaletteOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
})

/** Cours panel droit (mode Cours) : catalogue + markdown + watcher réactif sur le DAG caché. */
function CoursPanel() {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('Tous')
  const [selected, setSelected] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [hintsEnabled, setHintsEnabled] = useState(true)
  const course = selected ? getCourse(selected) : undefined
  const sections = course?.sections ?? []
  const sectionBodies = useMemo(() => {
    if (!course) return [] as string[]
    const raw = course.body
    const parts = raw.split(/\n(?=##\s)/)
    return parts.map(p => p.trim()).filter(Boolean)
  }, [course])
  useEffect(() => { setIdx(0) }, [selected])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(c => {
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      const d = difficulty.toLowerCase()
      const matchD = d === 'tous' || d === 'all' || c.difficulty === d
      return matchQ && matchD
    })
  }, [query, difficulty])
  const jump = (i: number) => {
    if (i < 0 || i >= sections.length) return
    setIdx(i)
  }
  const { flowNodes, flowEdges } = useAppStore(useShallow(s => ({ flowNodes: s.flowNodes, flowEdges: s.flowEdges })))
  const watcher = useMemo(() => {
    if (!course || !hintsEnabled) return null
    const expected = (course as unknown as { expected?: { nodes: { id: string; type: string }[]; edges: { from: string; fromPort?: string; to: string; toPort?: string }[]; hints: Record<string, string> } }).expected
    if (!expected || !Array.isArray(expected.nodes) || !Array.isArray(expected.edges)) return null
    function nodeType(n: Node): string | undefined {
      const d = n.data
      if (!d || typeof d !== 'object' || !('type' in d)) return undefined
      const t = (d as Record<string, unknown>).type
      return typeof t === 'string' ? t : undefined
    }
    const actualTypes = new Set(flowNodes.map(nodeType).filter((t): t is string => Boolean(t)))
    const expectedTypes = new Set(expected.nodes.map(n => n.type))
    const missing = [...expectedTypes].filter(t => !actualTypes.has(t))
    const extra = [...actualTypes].filter(t => !expectedTypes.has(t))
    const idToType = new Map(expected.nodes.map(n => [n.id, n.type] as const))
    let edgeMismatch: { from: string; fromPort?: string; to: string; toPort?: string } | null = null
    for (const e of expected.edges) {
      const fromType = idToType.get(e.from)
      const toType = idToType.get(e.to)
      if (!fromType || !toType) continue
      const found = flowEdges.some(fe => {
        const sN = flowNodes.find(n => n.id === fe.source)
        const tN = flowNodes.find(n => n.id === fe.target)
        const sType = sN ? nodeType(sN) : undefined
        const tType = tN ? nodeType(tN) : undefined
        if (sType !== fromType || tType !== toType) return false
        if (e.fromPort && fe.sourceHandle !== e.fromPort) return false
        if (e.toPort && fe.targetHandle !== e.toPort) return false
        return true
      })
      if (!found) { edgeMismatch = e; break }
    }
    if (missing.length === 0 && !edgeMismatch && extra.length === 0) return null
    return { missing, extra, edgeMismatch, idToType }
  }, [course, hintsEnabled, flowNodes, flowEdges])
  let bannerText: string | null = null
  if (watcher) {
    if (watcher.missing.length) {
      const t = watcher.missing[0]
      const friendly = (course as unknown as { expected: { hints: Record<string, string> } }).expected.hints?.[t] ?? t
      bannerText = `Ce n'est pas le bon bloc — attendu ${friendly}`
    } else if (watcher.edgeMismatch) {
      const e = watcher.edgeMismatch
      const fromType = watcher.idToType.get(e.from) ?? e.from
      const toType = watcher.idToType.get(e.to) ?? e.to
      const actualEdge = flowEdges.find(fe => {
        const sN = flowNodes.find(n => n.id === fe.source)
        const tN = flowNodes.find(n => n.id === fe.target)
        const sType = sN && typeof sN.data === 'object' && sN.data && 'type' in sN.data ? (sN.data as Record<string, unknown>).type : undefined
        const tType = tN && typeof tN.data === 'object' && tN.data && 'type' in tN.data ? (tN.data as Record<string, unknown>).type : undefined
        return sType === fromType && tType === toType
      })
      if (e.fromPort && actualEdge?.sourceHandle && actualEdge.sourceHandle !== e.fromPort) {
        bannerText = `Mauvais branchement — ${fromType} doit aller vers ${toType} via ${e.fromPort}, pas ${actualEdge.sourceHandle}`
      } else if (e.toPort && actualEdge?.targetHandle && actualEdge.targetHandle !== e.toPort) {
        bannerText = `Mauvais branchement — ${fromType} doit aller vers ${toType} via ${e.toPort}, pas ${actualEdge.targetHandle}`
      } else if (e.fromPort || e.toPort) {
        const port = e.fromPort ?? e.toPort ?? 'port'
        bannerText = `Mauvais branchement — ${fromType} → ${toType} via ${port}`
      } else {
        bannerText = `Mauvais branchement — ${fromType} → ${toType}`
      }
    } else if (watcher.extra.length) {
      const t = watcher.extra[0]
      bannerText = `Bloc inattendu — ${t} ne fait pas partie de ce cours`
    }
  }
  if (course) {
    const currentBody = sectionBodies[idx] ?? sectionBodies[0] ?? course.body
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: theme.color.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 700, textAlign: 'left', padding: 0 }}>← Retour au catalogue</button>
        <div style={{ fontWeight: 800, fontSize: 14, color: theme.color.text }}>{course.title}</div>
        {bannerText ? (
          <div style={{ background: `${theme.color.warning}18`, border: `1px solid ${theme.color.warning}`, borderRadius: 10, padding: '8px 10px', color: theme.color.warning, fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
            {bannerText}
          </div>
        ) : null}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 420, paddingRight: 2 }}>
          <Markdown>{currentBody}</Markdown>
        </div>
        {sections.length > 0 ? (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button label="Précédent" variant="ghost" onClick={() => jump(idx - 1)} isDisabled={idx === 0} />
              <span style={{ fontSize: 12, color: theme.color.textMuted }}>{idx + 1} / {sections.length}</span>
              <Button label="Suivant" variant="ghost" onClick={() => jump(idx + 1)} isDisabled={idx === sections.length - 1} />
            </div>
          </>
        ) : null}
        <HStack gap={2} style={{ alignItems: 'center', paddingTop: 4 }}>
          <Switch label={`Indices: ${hintsEnabled ? 'ON' : 'OFF'}`} value={hintsEnabled} onChange={setHintsEnabled} size="sm" />
        </HStack>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TextInput label="Rechercher un cours" isLabelHidden value={query} onChange={setQuery} placeholder="Rechercher un cours…" />
      <ToggleButtonGroup type="single" label="Difficulté" value={difficulty} onChange={v => setDifficulty((v as string) || 'Tous')} size="sm">
        <Grid columns={2} gap={1.5}>
          <ToggleButton label="Tous" value="Tous" />
          <ToggleButton label="Facile" value="facile" />
          <ToggleButton label="Moyen" value="moyen" />
          <ToggleButton label="Difficile" value="difficile" />
        </Grid>
      </ToggleButtonGroup>
      {courses.length === 0 ? (
        <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '18px 6px' }}>Aucun cours disponible</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '18px 6px' }}>Aucun cours trouvé</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <ClickableCard key={c.slug} label={c.title} onClick={() => setSelected(c.slug)} padding={2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text }}>{c.title}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: theme.color.textMuted }}>{c.difficulty}</span>
                <span style={{ fontSize: 12, color: theme.color.textMuted, lineHeight: 1.4 }}>{c.description}</span>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}
    </div>
  )
}

function InspectorPanel({
  onToggleCollapse,
  rightMode = 'inspecteur',
  onChangeMode,
  hasOutputs = false,
}: {
  onToggleCollapse?: () => void
  rightMode?: 'cours' | 'inspecteur'
  onChangeMode?: (v: string | null) => void
  hasOutputs?: boolean
}) {
  const flowNodes = useAppStore(s => s.flowNodes)
  const catalog = useAppStore(s => s.catalog)
  const results = useAppStore(s => s.results)
  const jobOutputs = useAppStore(s => s.jobOutputs)
  const selected = flowNodes.find(n => n.selected)
  const data = selected?.data as { label?: string; type?: string; category?: string } | undefined
  const def = data?.type ? catalog?.blocks[data.type] : undefined
  const outputs = jobOutputs.length ? jobOutputs : results
  const count = outputs.length
  const inspecteurLabel = count > 0 ? (count > 1 ? `Inspecteur •${count}` : 'Inspecteur •') : hasOutputs ? 'Inspecteur •' : 'Inspecteur'
  // Per-block: filtre par block_id (node.id), fallback block_name quand block_id absent (compat anciennes sorties)
  const selectedOutputs = selected
    ? outputs.filter(o => {
        if (o.block_id) return o.block_id === selected.id
        return o.block_name === data?.type
      })
    : []
  return (
    <div
      className="floating-panel inspector-panel"
      style={{
        width: 260,
        flexShrink: 0,
        background: theme.color.surface2,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.xl,
        boxShadow: '0 8px 32px rgba(0,0,0,.12)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'none',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${theme.color.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {onToggleCollapse && (
          <IconButton
            label="Replier"
            icon={<PanelRight size={16} />}
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          />
        )}
        <ToggleButtonGroup
          type="single"
          label="Mode"
          value={rightMode}
          onChange={v => {
            if (v) onChangeMode?.(v)
          }}
          size="sm"
        >
          <ToggleButton label="Cours" value="cours" />
          <ToggleButton label={inspecteurLabel} value="inspecteur" />
        </ToggleButtonGroup>
      </div>
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
        }}
      >
        {rightMode === 'cours' ? (
          <CoursPanel />
        ) : !selected ? (
          <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '18px 6px' }}>
            Sélectionne un bloc
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: theme.color.text }}>{data?.label ?? selected.id}</div>
            {data?.type && <div style={{ fontSize: 12, color: theme.color.textMuted }}>{data.type}</div>}
            {data?.category && <div style={{ fontSize: 12, color: theme.color.textMuted }}>Catégorie : {data.category}</div>}
            {def?.description && <div style={{ fontSize: 13, color: theme.color.textLight, lineHeight: 1.5 }}>{def.description}</div>}
            {def?.inputs?.length ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: theme.color.textMuted, marginBottom: 4 }}>Entrées</div>
                {def.inputs.map(p => (
                  <div key={p.name} style={{ fontSize: 12, color: theme.color.textLight }}>{p.name} · {p.dtype}</div>
                ))}
              </div>
            ) : null}
            {def?.outputs?.length ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: theme.color.textMuted, marginBottom: 4 }}>Sorties</div>
                {def.outputs.map(p => (
                  <div key={p.name} style={{ fontSize: 12, color: theme.color.textLight }}>{p.name} · {p.dtype}</div>
                ))}
              </div>
            ) : null}
            <Divider />
            {selectedOutputs.length === 0 ? (
              <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '10px 6px' }}>
                En attente…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: theme.color.textMuted }}>Sortie</div>
                {selectedOutputs.map((o, i) => {
                  let parsed: unknown
                  try { parsed = JSON.parse(o.output) } catch { parsed = null }
                  const isTooLarge = o.output.length > 20000
                  if (isTooLarge) console.warn('[Inspecteur] sortie tronquée', o.block_id ?? o.block_name)
                  const pretty = (() => {
                    if (parsed && typeof parsed === 'object') {
                      try { return JSON.stringify(parsed, null, 2) } catch { return o.output }
                    }
                    return o.output
                  })()
                  // Type-specific preview: reuse typed payload rendering when possible
                  const typed = parsed as { type?: string; points?: number[]; values?: Record<string, unknown>; value?: number; text?: string; data?: string; mime?: string } | null
                  const isImage = typed?.type === 'image' && typeof typed.data === 'string'
                  const isCurve = typed?.type === 'curve' && Array.isArray(typed.points)
                  const isMetrics = typed?.type === 'metrics' && typed.values
                  const isMetric = typed?.type === 'metric' && typeof typed.value === 'number'
                  return (
                    <div key={`${o.block_id ?? o.block_name}-${i}`} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${theme.color.border}`, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {isImage ? (
                        <img src={`data:${typed.mime ?? 'image/png'};base64,${typed.data}`} alt={o.block_name} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, display: 'block' }} />
                      ) : isCurve ? (
                        <div style={{ fontSize: 12, color: theme.color.textMuted }}>{(typed.points?.length ?? 0)} points · min {Math.min(...typed.points!).toFixed(2)} · max {Math.max(...typed.points!).toFixed(2)}</div>
                      ) : isMetrics ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: 12 }}>
                          {Object.entries(typed.values!).map(([k, v]) => (
                            <div key={k} style={{ display: 'contents' }}>
                              <span style={{ fontWeight: 700, opacity: 0.75 }}>{k}</span>
                              <span style={{ fontWeight: 800 }}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : isMetric ? (
                        <div style={{ fontWeight: 800, fontSize: 16, color: theme.color.success }}>{typed.value}</div>
                      ) : null}
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.4, color: theme.color.textLight, maxHeight: 220, overflowY: 'auto' }}>{pretty.slice(0, 4000)}{pretty.length > 4000 ? '\n…[tronqué]' : ''}</pre>
                      <div style={{ fontSize: 10, color: theme.color.textMuted }}>{new Date(o.created_at).toLocaleTimeString()}</div>
                      {i < selectedOutputs.length - 1 ? <Divider /> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
