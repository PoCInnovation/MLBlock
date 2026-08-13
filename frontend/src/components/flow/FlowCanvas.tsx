import React, { useCallback, useMemo, useRef } from 'react'
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
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import BlockNode from './BlockNode'
import ColumnNode from './ColumnNode'
import FlowPalette from './FlowPalette'
import ConsolePanel from '../ui/ConsolePanel'
import { segsToFields } from '../../utils/flowConversion'
import { buildConversionGraph, classifyEdge, converterFor, portDtype } from '../../utils/typeCheck'
import { COL_W, COL_PAD, BLOCK_W, HEADER_H, colHeight, colOf, isEdgeValid, maxRowInCol, posFor, rowOf, snapPosition } from '../../utils/gridLayout'
import type { InternalCatalog, Port } from '../../types/catalog'

const nodeTypes = { block: BlockNode, column: ColumnNode }

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
  const viewMode = useAppStore(s => s.viewMode)
  const columns = useAppStore(s => s.columns)
  const selectedCol = useAppStore(s => s.selectedCol)
  const setSelectedCol = useAppStore(s => s.setSelectedCol)
  const moveNodeTo = useAppStore(s => s.moveNodeTo)
  const addColumn = useAppStore(s => s.addColumn)

  const { screenToFlowPosition, fitView } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const graph = useMemo(
    () => (catalog ? buildConversionGraph(catalog.blocks) : new Map<string, Set<string>>()),
    [catalog]
  )

  // Colonnes en arrière-plan (nœuds ReactFlow non interactifs, zIndex -1).
  const columnNodes = useMemo(() => {
    if (viewMode !== 'grid') return []
    return columns.map((c, i) => {
      const height = colHeight(flowNodes, i)
      return {
        id: c.id,
        type: 'column' as const,
        position: { x: i * COL_W + COL_PAD, y: 0 },
        data: { column: c, index: i, height },
        width: COL_W - 2 * COL_PAD,
        height,
        draggable: false,
        selectable: false,
        focusable: false,
        // PAS de zIndex négatif : il peint les colonnes SOUS le pane de
        // ReactFlow (z-index 1) — les clics (dropdown, renommage, sélection)
        // atterrissaient sur le pan. L'ordre DOM (colonnes puis blocs) garde
        // les blocs au-dessus.
        style: { width: COL_W - 2 * COL_PAD, height },
      }
    })
  }, [viewMode, columns, flowNodes])

  const insertConverter = useCallback((conn: Connection, convType: string) => {
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
    const edgeA: Edge = {
      id: `e_${conn.source}_${convId}`,
      source: conn.source ?? '',
      sourceHandle: conn.sourceHandle ?? 'out_1',
      target: convId,
      targetHandle: convIn,
    }
    const edgeB: Edge = {
      id: `e_${convId}_${conn.target}`,
      source: convId,
      sourceHandle: convOut,
      target: conn.target ?? '',
      targetHandle: conn.targetHandle ?? 'in_1',
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
    // Les hauteurs mesurées arrivent par ici : re-packe les colonnes (auto-size)
    if (changes.some(c => c.type === 'dimensions') && s.viewMode === 'grid') s.reflow()
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const s = useAppStore.getState()
    if (changes.some(c => c.type === 'remove')) s.commitUndoPoint()
    s.applyFlowEdgeChanges(changes)
  }, [])

  const onConnect = useCallback((params: Connection) => {
    useAppStore.getState().commitUndoPoint()
    // Règle gauche→droite de la vue grille : le lien doit viser une colonne
    // strictement supérieure (acyclicité + indépendance intra-colonne).
    if (viewMode === 'grid') {
      const src = flowNodes.find(n => n.id === params.source)
      const tgt = flowNodes.find(n => n.id === params.target)
      if (src && tgt && colOf(tgt) <= colOf(src)) {
        showToast({ kind: 'error', message: 'Impossible : le lien doit aller vers une colonne à droite' })
        return
      }
    }
    if (!catalog) {
      addFlowEdges(addEdge(params, []))
      return
    }
    const src = flowNodes.find(n => n.id === params.source)
    const tgt = flowNodes.find(n => n.id === params.target)
    const srcDtype = portDtype(portList(src, 'outputs'), params.sourceHandle)
    const tgtDtype = portDtype(portList(tgt, 'inputs'), params.targetHandle)
    if (!src || !tgt || !srcDtype || !tgtDtype) {
      addFlowEdges(addEdge(params, []))
      return
    }
    const verdict = classifyEdge(srcDtype, tgtDtype, graph)
    if (verdict === 'compatible') {
      addFlowEdges(addEdge(params, []))
    } else if (verdict === 'convertible') {
      const conv = converterFor(srcDtype, tgtDtype, catalog.blocks)
      if (!conv) {
        showToast({ kind: 'error', message: `${srcDtype} → ${tgtDtype} : chemin de conversion introuvable` })
        return
      }
      showToast({
        kind: 'convert',
        message: `${srcDtype} → ${tgtDtype} : conversion via ${conv}`,
        action: () => insertConverter(params, conv),
      })
    } else {
      showToast({ kind: 'error', message: `${srcDtype} → ${tgtDtype} : aucune conversion possible` })
    }
  }, [catalog, flowNodes, flowEdges, graph, addFlowEdges, showToast, insertConverter, viewMode])

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

      let position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      if (viewMode === 'grid') {
        // Dépôt dans la colonne sélectionnée (sinon celle sous la souris),
        // en fin de pile.
        const col = selectedCol
          ? columns.findIndex(c => c.id === selectedCol)
          : Math.round((position.x - (COL_W - BLOCK_W) / 2) / COL_W)
        const colIdx = Math.max(0, col)
        position = posFor(colIdx, maxRowInCol(flowNodes, colIdx) + 1)
      }
      const def = catalog.blocks[type]
      const cat = catalog.categories.find(c => c.id === def.cat)
      const label = def.segs.find(s => s.t === 'text')?.v ?? type

      const node: Node = {
        id: `${type}_${Date.now()}`,
        type: 'block',
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
      addFlowNode(node)
      // Le reflow génère les colonnes manquantes et empile le nouveau bloc.
      useAppStore.getState().reflow()
      // ponytail: fitView recenters on the dropped node — screenToFlowPosition
      // on an empty canvas (fitView scale ~0.1) yields enormous flow coords
      setTimeout(() => fitView(viewMode === 'grid' ? { padding: 0.2, duration: 300, maxZoom: 1 } : { padding: 0.2, duration: 300 }), 50)
    },
    [catalog, screenToFlowPosition, addFlowNode, fitView, viewMode, selectedCol, columns, flowNodes]
  )

  // Vue grille : snap à la fin du geste (1 commit par geste, uniquement si la
  // cellule change). Le commit est géré dans moveNodeTo (position rétablie).
  // La rangée = position d'insertion réelle : les blocs de la colonne cible
  // sont packés (hauteurs mesurées) — on compte ceux au-dessus du point de
  // drop, plus d'approximation par pas fixe.
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (viewMode !== 'grid') return
    const snapped = snapPosition(node.position)
    const col = snapped.col
    const above = flowNodes
      .filter(n => n.id !== node.id && colOf(n) === col && n.position.y < node.position.y)
      .reduce((m, n) => Math.max(m, rowOf(n)), -1)
    moveNodeTo(node.id, col, above + 1)
  }, [viewMode, moveNodeTo, flowNodes])

  const renderEdges = useMemo(
    () => flowEdges.map(e => {
      const base = edgeStyleFor(e, flowNodes, graph)
      if (viewMode === 'grid' && !isEdgeValid(e, flowNodes)) {
        // Liens hérités qui violent la règle gauche→droite : signalés sans
        // bloquer (l'exécution reste possible, le topo sort s'en charge).
        return { ...e, style: { ...base, stroke: theme.color.warning, strokeDasharray: '8 4' } }
      }
      return { ...e, style: base }
    }),
    [flowEdges, flowNodes, graph, viewMode]
  )

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0, minHeight: 0, height: '100%' }}>
      <FlowPalette onDragStart={onDragStart} />
      <div ref={wrapperRef} style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={viewMode === 'grid' ? [...columnNodes, ...flowNodes] : flowNodes}
          edges={renderEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          style={reactFlowStyle}
          fitView
          fitViewOptions={viewMode === 'grid' ? { maxZoom: 1 } : undefined}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
        {viewMode === 'grid' && (
          <button
            onClick={addColumn}
            title="Ajouter une colonne"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              background: 'rgba(217,119,87,.16)',
              color: theme.color.accentLight,
              border: '1px solid rgba(217,119,87,.45)',
              padding: '7px 13px',
              borderRadius: theme.radius.md,
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            + Colonne
          </button>
        )}
      </div>
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
