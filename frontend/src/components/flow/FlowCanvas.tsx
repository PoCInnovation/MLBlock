import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
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
import { AlignVerticalJustifyCenter } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { ClickableCard, Divider, HStack, VStack, Badge } from '@astryxdesign/core'
import { BottomSheet } from '@astryxdesign/core/BottomSheet'
import { Text, Heading } from '@astryxdesign/core/Text'
import BlockNode from './BlockNode'
import SuperBlockNode from './SuperBlockNode'
import { isSuperBlock, SUPER_BLOCK_REGISTRY } from './superBlockRegistry'
import FlowLink from './FlowLink'
import JournalPanel from './JournalPanel'
import ConverterDialog from './ConverterDialog'
import { segsToFields } from '../../utils/flowConversion'
import { portDtype } from '../../utils/typeCheck'
import { typeSystem } from '../../utils/typeSystem'
import { resolveConnection, type ResolvedConnection } from '../../utils/portResolution'
import { arrangeGraph } from '../../utils/layout'
import { stageOfBlock, getStageConfig } from '../../utils/stages'
import type { Port } from '../../types/catalog'

const nodeTypes = {
  block: BlockNode,
  superblock: SuperBlockNode,
}
const edgeTypes = { flow: FlowLink }

const reactFlowClassName = 'bg-canvas rounded-2xl'

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
  const verdict = typeSystem.classify(srcDtype, tgtDtype, graph)
  return {
    stroke: edgeColor[verdict],
    strokeDasharray: verdict === 'convertible' ? '6 4' : undefined,
  }
}

const FlowCanvasInner = React.memo(function FlowCanvasInner() {
  const { flowNodes, flowEdges } = useAppStore(useShallow(s => ({
    flowNodes: s.flowNodes,
    flowEdges: s.flowEdges,
  })))
  const addFlowNode = useAppStore(s => s.addFlowNode)
  const addFlowEdges = useAppStore(s => s.addFlowEdges)
  const catalog = useAppStore(s => s.catalog)
  const showToast = useAppStore(s => s.showToast)
  const activeSheet = useAppStore(s => s.activeSheet)
  const setActiveSheet = useAppStore(s => s.setActiveSheet)
  const jobStatus = useAppStore(s => s.jobStatus)

  const { screenToFlowPosition, fitView, getZoom } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fitViewTimerRef = useRef<number | null>(null)
  const tapSeq = useRef(0)

  const [converterPrompt, setConverterPrompt] = useState<{
    conn: Connection
    convType: string
    convLabel: string
    resolved: ResolvedConnection
  } | null>(null)

  useEffect(() => {
    if (jobStatus !== 'running') return
    setActiveSheet('journal')
  }, [jobStatus, setActiveSheet])

  useEffect(() => {
    return () => {
      clearTimeout(fitViewTimerRef.current ?? undefined)
    }
  }, [])

  const graph = useMemo(
    () => (catalog ? typeSystem.buildConversionGraph(catalog.blocks) : new Map<string, Set<string>>()),
    [catalog]
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some(c => c.type === 'remove')) useAppStore.getState().commitUndoPoint()
      useAppStore.getState().applyFlowNodeChanges(changes)
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some(c => c.type === 'remove')) useAppStore.getState().commitUndoPoint()
      useAppStore.getState().applyFlowEdgeChanges(changes)
    },
    []
  )

  const insertConverter = useCallback((conn: Connection, convType: string, resolved: ResolvedConnection) => {
    useAppStore.getState().commitUndoPoint()
    const { flowNodes, flowEdges } = useAppStore.getState()
    if (!catalog) return
    const def = catalog.blocks[convType]
    if (!def) return

    const src = flowNodes.find(n => n.id === conn.source)
    const tgt = flowNodes.find(n => n.id === conn.target)
    if (!src || !tgt) return

    const convX = (src.position.x + tgt.position.x) / 2
    const convY = (src.position.y + tgt.position.y) / 2
    const convId = `${convType}_${Date.now()}`
    const cat = catalog.categories.find(c => c.id === def.cat)
    const convNode: Node = {
      id: convId,
      type: 'block',
      dragHandle: '.block-drag-handle',
      position: { x: convX, y: convY },
      data: {
        type: convType,
        label: def.segs.find(s => s.t === 'text')?.v ?? convType,
        category: def.cat,
        categoryColor: cat?.color ?? theme.color.accent,
        segs: def.segs,
        fields: segsToFields(def),
        inputs: def.inputs,
        outputs: def.outputs,
        stage: def.stage ?? stageOfBlock(convType, def.cat),
        stage_name: def.stage_name,
      },
    }

    const inPort = def.inputs[0]?.name ?? 'in_1'
    const outPort = def.outputs[0]?.name ?? 'out_1'
    const e1: Edge = {
      id: `e-${Date.now()}-1`,
      source: conn.source,
      sourceHandle: resolved.sourcePort,
      target: convId,
      targetHandle: inPort,
      type: 'flow',
    }
    const e2: Edge = {
      id: `e-${Date.now()}-2`,
      source: convId,
      sourceHandle: outPort,
      target: conn.target,
      targetHandle: resolved.targetPort,
      type: 'flow',
    }

    const remainingEdges = flowEdges.filter(e => !(e.source === conn.source && e.target === conn.target))
    addFlowNode(convNode)
    useAppStore.getState().setFlowEdges([...remainingEdges, e1, e2])
    const newEdges = [...remainingEdges, e1, e2]
    const layoutNodes = [...flowNodes, convNode].map(n => ({ id: n.id, width: 220, height: 140 }))
    const positions = arrangeGraph(layoutNodes, newEdges)
    useAppStore.getState().setFlowNodes([...flowNodes, convNode].map(n => ({ ...n, position: positions[n.id] ?? n.position })))
  }, [catalog, addFlowNode])

  const buildNode = useCallback((type: string, position: { x: number; y: number }): Node | null => {
    if (!catalog) return null
    const def = catalog.blocks[type]
    if (!def) return null
    const cat = catalog.categories.find(c => c.id === def.cat)
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const stage = def.stage ?? stageOfBlock(type, def.cat)
    const isSuper = isSuperBlock(type)
    return {
      id: `${type}_${Date.now()}`,
      type: isSuper ? 'superblock' : 'block',
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
        children: type === 'sequential_container' ? [] : undefined,
        stage,
        stage_name: def.stage_name,
      },
    }
  }, [catalog])

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target || !catalog) return
    const { flowNodes, flowEdges } = useAppStore.getState()
    const src = flowNodes.find(n => n.id === params.source)
    const tgt = flowNodes.find(n => n.id === params.target)
    if (!src || !tgt) return

    const srcOutputs = portList(src, 'outputs')
    const tgtInputs = portList(tgt, 'inputs')
    const resolved = resolveConnection(srcOutputs, tgtInputs, params.sourceHandle, params.targetHandle, graph)

    if (!resolved || !resolved.targetPort) {
      showToast({ kind: 'error', message: 'Aucun port d\'entrée compatible disponible sur la cible' })
      return
    }

    const srcDtype = portDtype(srcOutputs, resolved.sourcePort)
    const tgtDtype = portDtype(tgtInputs, resolved.targetPort)
    if (!srcDtype || !tgtDtype) {
      showToast({ kind: 'error', message: 'Impossible de résoudre les types des ports' })
      return
    }

    if (resolved.verdict === 'compatible') {
      const edgeStyle = edgeStyleFor({ ...params, sourceHandle: resolved.sourcePort, targetHandle: resolved.targetPort } as Edge, flowNodes, graph)
      const newEdge: Edge = {
        id: `e-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: resolved.sourcePort,
        targetHandle: resolved.targetPort,
        type: 'flow',
        style: edgeStyle,
      }
      useAppStore.getState().commitUndoPoint()
      addFlowEdges(addEdge(newEdge, flowEdges))
    } else {
      const conv = typeSystem.findConverter(srcDtype, tgtDtype, catalog.blocks)
      if (!conv) {
        const srcBlock = ((src.data as Record<string, unknown>)?.type as string) ?? src.id
        const tgtBlock = ((tgt.data as Record<string, unknown>)?.type as string) ?? tgt.id
        const [, diag] = typeSystem.canConnect(srcDtype, tgtDtype, graph, srcBlock, tgtBlock, catalog.blocks)
        showToast({ kind: 'error', message: diag ?? `${resolved.sourcePort} -> ${resolved.targetPort} incompatible` })
        return
      }
      const convDef = catalog.blocks[conv]
      const convLabel = convDef?.segs.find(s => s.t === 'text')?.v ?? conv
      setConverterPrompt({
        conn: params,
        convType: conv,
        convLabel,
        resolved,
      })
    }
  }, [catalog, graph, addFlowEdges, showToast])


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
      fitViewTimerRef.current = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    },
    [catalog, screenToFlowPosition, buildNode, addFlowNode, fitView]
  )

  const addNodeAtCenter = useCallback((type: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const position = screenToFlowPosition({ x, y: y + (tapSeq.current++ % 6) * 22 })
    const node = buildNode(type, position)
    if (!node) return
    useAppStore.getState().commitUndoPoint()
    addFlowNode(node)
    setActiveSheet(null)
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
  }, [buildNode, screenToFlowPosition, addFlowNode, fitView, setActiveSheet])

  const handleArrange = useCallback(() => {
    if (useAppStore.getState().flowNodes.length < 2) return
    requestAnimationFrame(() => {
      const store = useAppStore.getState()
      if (store.flowNodes.length < 2) return
      const zoom = getZoom() || 1
      const elById: Record<string, Element> = {}
      wrapperRef.current?.querySelectorAll('.react-flow__node').forEach(el => {
        const id = el.getAttribute('data-id')
        if (id) elById[id] = el
      })
      const nodes = store.flowNodes.map(n => {
        const rect = elById[n.id]?.getBoundingClientRect()
        const width = rect && rect.width > 0 ? rect.width / zoom : 220
        const height = rect && rect.height > 0 ? rect.height / zoom : 140
        return { id: n.id, width, height }
      })
      const edges = store.flowEdges.map(e => ({ source: e.source, target: e.target }))
      const positions = arrangeGraph(nodes, edges)
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

  const handleNodeClick = useCallback(() => setActiveSheet('inspect'), [setActiveSheet])
  return (
    <div className="flex-1 relative flex w-full min-w-0 min-h-0 h-full items-stretch">
      <div
        ref={wrapperRef}
        className="floating-panel floating-canvas flex-1 w-full self-stretch h-full min-h-0 rounded-2xl overflow-hidden shadow-2xl min-w-0 relative"
      >
        <ReactFlow
          nodes={flowNodes}
          edges={renderEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionRadius={40}
          edgeTypes={edgeTypes}
          className={reactFlowClassName}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls
            className="floating-panel rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
          >
            <ControlButton
              onClick={handleArrange}
              title="Disposer"
              aria-label="Disposer les blocs automatiquement"
              disabled={flowNodes.length < 2}
              className="text-surface"
            >
              <AlignVerticalJustifyCenter size={18} />
            </ControlButton>
          </Controls>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* Unified Astryx BottomSheet for Add, Inspect, and Journal */}
      <BottomSheet
        isOpen={activeSheet !== null}
        onOpenChange={open => !open && setActiveSheet(null)}
        label={
          activeSheet === 'add'
            ? 'Ajouter un Super-Bloc'
            : activeSheet === 'inspect'
            ? 'Inspecteur de Paramètres'
            : 'Journal d’Exécution'
        }
        height={activeSheet === 'inspect' ? 'tall' : 'capped'}
        hasScrim={false}
      >
        <div className="p-5 min-h-0 h-full overflow-y-auto">
          {activeSheet === 'add' && (
            <VStack gap={3}>
              <Heading level={4}>Catalogue des Super-Blocs</Heading>
              <Text type="body" color="secondary">
                Sélectionnez un Super-Bloc à instancier directement sur votre canvas.
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {Object.entries(SUPER_BLOCK_REGISTRY).map(([typeKey, def]) => {
                  const stageCfg = getStageConfig(def.stage)
                  return (
                    <ClickableCard
                      key={typeKey}
                      label={`Ajouter ${def.title}`}
                      onClick={() => {
                        addNodeAtCenter(typeKey)
                      }}
                      padding={3}
                      elevation="low"
                    >
                      <VStack gap={2}>
                        <HStack gap={2} className="items-center">
                          <Badge
                            label={stageCfg.key}
                            className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
                          />
                          <span className="font-extrabold text-sm text-text">{def.title}</span>
                        </HStack>
                        <span className="text-xs text-text-muted">{def.subtitle}</span>
                        <HStack gap={2} className="text-xs text-text-dim mt-1">
                          <span>Entrées: {def.inputs.length}</span>
                          <span>•</span>
                          <span>Sorties: {def.outputs.length}</span>
                        </HStack>
                      </VStack>
                    </ClickableCard>
                  )
                })}
              </div>
            </VStack>
          )}

          {activeSheet === 'inspect' && <NodeInspector />}

          {activeSheet === 'journal' && <JournalPanel />}
        </div>
      </BottomSheet>

      {converterPrompt && (
        <ConverterDialog
          open={Boolean(converterPrompt)}
          blockName={converterPrompt.convType}
          blockLabel={converterPrompt.convLabel}
          onConfirm={() => {
            insertConverter(converterPrompt.conn, converterPrompt.convType, converterPrompt.resolved)
            setConverterPrompt(null)
          }}
          onCancel={() => {
            setConverterPrompt(null)
          }}
        />
      )}
    </div>
  )
})

function NodeInspector() {
  const flowNodes = useAppStore(s => s.flowNodes)
  const catalog = useAppStore(s => s.catalog)
  const updateFlowParam = useAppStore(s => s.updateFlowParam)
  const selected = flowNodes.find(n => n.selected)
  const data = selected?.data as Record<string, unknown> | undefined
  const type = (data?.type as string) ?? ''
  const superDef = SUPER_BLOCK_REGISTRY[type]
  const def = type ? catalog?.blocks[type] : undefined
  const stageNum = (data?.stage as number) ?? def?.stage ?? superDef?.stage ?? 2
  const stageConfig = getStageConfig(stageNum)
  const fields = (data?.fields as Record<string, string>) ?? {}

  if (!selected) {
    return (
      <VStack gap={2} className="py-8 items-center text-center">
        <Heading level={5}>Inspecteur</Heading>
        <Text type="body" color="secondary">
          Sélectionnez un bloc sur le canvas pour examiner et modifier ses paramètres.
        </Text>
      </VStack>
    )
  }

  return (
    <VStack gap={3}>
      <HStack gap={2} className="items-center justify-between">
        <HStack gap={2} className="items-center">
          <Badge
            label={stageConfig.key}
            className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
          />
          <Heading level={4}>{String(data?.label ?? selected.id)}</Heading>
        </HStack>
        <span className="text-xs text-text-dim font-mono">
          {type}
        </span>
      </HStack>
      <Text type="body" color="secondary">
        {superDef?.subtitle || def?.description || 'Bloc fonctionnel'}
      </Text>

      <Divider />

      <Heading level={5}>Paramètres du Nœud</Heading>
      {Object.keys(fields).length === 0 ? (
        <Text type="supporting" color="secondary">Aucun paramètre configurable.</Text>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(fields).map(([k, val]) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-xs font-bold text-text-muted">{k}</span>
              <input
                type="text"
                value={val}
                onChange={e => updateFlowParam(selected.id, k, e.target.value)}
                className="bg-surface border border-border rounded px-2 py-1 text-xs text-text font-mono"
              />
            </div>
          ))}
        </div>
      )}
    </VStack>
  )
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
