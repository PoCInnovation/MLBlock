import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Menu } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import BlockNode from './BlockNode'
import FlowLink from './FlowLink'
import FlowPalette from './FlowPalette'
import ConsolePanel from '../ui/ConsolePanel'
import { segsToFields } from '../../utils/flowConversion'
import { buildConversionGraph, classifyEdge, converterFor, portDtype } from '../../utils/typeCheck'
import { resolveConnection, type ResolvedConnection } from '../../utils/portResolution'
import type { InternalCatalog, Port } from '../../types/catalog'

const nodeTypes = { block: BlockNode }
const edgeTypes = { flow: FlowLink }

const reactFlowStyle: React.CSSProperties = {
  background: theme.color.canvas,
}

const edgeColor: Record<string, string> = {
  compatible: theme.color.success,
  convertible: theme.color.convert,
  incompatible: theme.color.error,
}

/** Ports of a flow node (reactflow Node data is untyped `any`). */
function portList(node: Node | undefined, side: 'inputs' | 'outputs'): Port[] | undefined {
  return node?.data?.[side]
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

function FlowCanvasInner() {
  // Single source of truth: the store. No local canvas state, no sync effects.
  const flowNodes = useAppStore(s => s.flowNodes)
  const flowEdges = useAppStore(s => s.flowEdges)
  const applyFlowNodeChanges = useAppStore(s => s.applyFlowNodeChanges)
  const applyFlowEdgeChanges = useAppStore(s => s.applyFlowEdgeChanges)
  const addFlowNode = useAppStore(s => s.addFlowNode)
  const addFlowEdges = useAppStore(s => s.addFlowEdges)
  const catalog = useAppStore(s => s.catalog)
  const showToast = useAppStore(s => s.showToast)

  const { screenToFlowPosition, fitView } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Tiroir palette mobile (overlay) — desktop : jamais ouvert, bouton caché.
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Compteur de taps : décale les ajouts successifs pour éviter l'empilement
  // exact au centre (le premier reste centré).
  const tapSeq = useRef(0)
  const paletteToggleRef = useRef<HTMLButtonElement>(null)
  const paletteDrawerRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

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
  }, [catalog, flowNodes, flowEdges, addFlowNode, addFlowEdges])

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
  }, [catalog, flowNodes, flowEdges, graph, addFlowEdges, showToast, insertConverter])

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

  const renderEdges = useMemo(
    () => flowEdges.map(e => {
      const base = edgeStyleFor(e, flowNodes, graph)
      return { ...e, type: 'flow' as const, style: base }
    }),
    [flowEdges, flowNodes, graph]
  )

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0, minHeight: 0, height: '100%' }}>
      {/* Palette : sidebar fixe ≥768px, masquée en mobile (tiroir ci-dessous).
          La sidebar n'a PAS de onAdd : le tap-to-add est mobile uniquement. */}
      <div className="flow-palette">
        <FlowPalette onDragStart={onDragStart} />
      </div>
      <div ref={wrapperRef} style={{ flex: 1, height: '100%' }}>
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
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>
      {/* Bouton d'ouverture de la palette (mobile uniquement, cf. index.css). */}
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
            className="palette-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Palette de blocs"
            tabIndex={-1}
          >
            <FlowPalette onDragStart={onDragStart} onAdd={addNodeAtCenter} onClose={() => setPaletteOpen(false)} />
          </div>
        </>
      )}
      <ConsolePanel />
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
