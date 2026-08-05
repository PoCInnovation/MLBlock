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
} from 'reactflow'
import 'reactflow/dist/style.css'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import BlockNode from './BlockNode'
import FlowPalette from './FlowPalette'
import ConsolePanel from '../ui/ConsolePanel'
import { segsToParams } from '../../utils/flowConversion'
import { buildConversionGraph, classifyEdge, converterFor, portDtype } from '../../utils/typeCheck'
import type { InternalCatalog, Port } from '../../types/catalog'

const nodeTypes = { block: BlockNode }

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

  const graph = useMemo(
    () => (catalog ? buildConversionGraph(catalog.blocks) : new Map<string, Set<string>>()),
    [catalog]
  )

  const insertConverter = useCallback((conn: Connection, convType: string) => {
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
        params: segsToParams(def),
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

  const onConnect = useCallback((params: Connection) => {
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

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
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
          params: segsToParams(def),
          inputs: def.inputs,
          outputs: def.outputs,
        },
      }
      addFlowNode(node)
      // ponytail: fitView recenters on the dropped node — screenToFlowPosition
      // on an empty canvas (fitView scale ~0.1) yields enormous flow coords
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    },
    [catalog, screenToFlowPosition, addFlowNode, fitView]
  )

  const renderEdges = useMemo(
    () => flowEdges.map(e => ({ ...e, style: edgeStyleFor(e, flowNodes, graph) })),
    [flowEdges, flowNodes, graph]
  )

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0, minHeight: 0, height: '100%' }}>
      <FlowPalette onDragStart={onDragStart} />
      <div ref={wrapperRef} style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={renderEdges}
          onNodesChange={applyFlowNodeChanges}
          onEdgesChange={applyFlowEdgeChanges}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          style={reactFlowStyle}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
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
