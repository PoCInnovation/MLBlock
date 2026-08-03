import React, { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import BlockNode from './BlockNode'
import FlowPalette from './FlowPalette'
import ConsolePanel from '../ui/ConsolePanel'
import { segsToParams } from '../../utils/flowConversion'

const nodeTypes = { block: BlockNode }

const reactFlowStyle: React.CSSProperties = {
  background: theme.color.canvas,
}

function FlowCanvasInner() {
  const flowNodes = useAppStore(s => s.flowNodes)
  const flowEdges = useAppStore(s => s.flowEdges)
  const setFlowNodes = useAppStore(s => s.setFlowNodes)
  const setFlowEdges = useAppStore(s => s.setFlowEdges)
  const catalog = useAppStore(s => s.catalog)

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    setFlowNodes(nodes)
  }, [nodes, setFlowNodes])

  useEffect(() => {
    setFlowEdges(edges)
  }, [edges, setFlowEdges])

  // ponytail: resync store→canvas by length; misses equal-length add+delete swaps, fine for dev
  useEffect(() => {
    if (flowNodes.length !== nodes.length) setNodes(flowNodes)
    if (flowEdges.length !== edges.length) setEdges(flowEdges)
  }, [flowNodes, flowEdges, nodes.length, edges.length])

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

      const node = {
        id: `${type}_${Date.now()}`,
        type: 'block',
        position,
        data: {
          type,
          label,
          category: def.cat,
          categoryColor: cat?.color ?? theme.color.accent,
          params: segsToParams(def),
        },
      }
      setNodes(nds => [...nds, node])
      // ponytail: fitView recenters on the dropped node — screenToFlowPosition
      // on an empty canvas (fitView scale ~0.1) yields enormous flow coords
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    },
    [catalog, screenToFlowPosition, setNodes, fitView]
  )

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0, minHeight: 0, height: '100%' }}>
      <FlowPalette onDragStart={onDragStart} />
      <div ref={wrapperRef} style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
