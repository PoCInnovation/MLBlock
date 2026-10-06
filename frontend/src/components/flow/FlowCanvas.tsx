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
import { AlignVerticalJustifyCenter, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import BlockNode from './BlockNode'
import SuperBlockConfigSheet from './SuperBlockConfigSheet'
import CompatSheet from './CompatSheet'
import FlowLink from './FlowLink'
import JournalPanel from './JournalPanel'
import ConverterDialog from './ConverterDialog'
import { segsToFields } from '../../utils/flowConversion'
import { portDtype } from '../../utils/typeCheck'
import { typeSystem } from '../../utils/typeSystem'
import { resolveConnection, type ResolvedConnection } from '../../utils/portResolution'
import { arrangeGraph } from '../../utils/layout'
import { stageOfBlock, getStageConfig } from '../../utils/stages'
import { matchEngine, groupSuperblocks, defaultChildren, resolveEdgeStyle, availableChildren } from '../../utils/superblocks'
import BlockCard from './BlockCard'
import BlockSegments from '../blocks/BlockSegments'
import type { Port, PipelineNode as CatalogNode } from '../../types/catalog'
const nodeTypes = {
  block: BlockNode,
  superblock: BlockNode,
}
const edgeTypes = { flow: FlowLink }

const reactFlowClassName = 'bg-canvas rounded-2xl'

const ENGINE_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'sklearn', label: 'Scikit-Learn & XGBoost' },
  { value: 'gym', label: 'Gymnasium RL' },
  { value: 'mlflow-viz', label: 'MLflow & Viz' },
]

// Titres des 3 macro-étapes (fallback si le catalogue ne les sert pas).
const MACRO_FALLBACK: Record<number, string> = {
  1: 'Données / Environnement & Préparation',
  2: 'Modèle & Entraînement',
  3: 'Évaluation & Visualisation',
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
  const setConfigTarget = useAppStore(s => s.setConfigTarget)
  const configTarget = useAppStore(s => s.configTarget)
  const configSb = useMemo(
    () => catalog?.superblocks.find(s => s.id === configTarget) ?? null,
    [catalog, configTarget],
  )
  const compatSource = useAppStore(s => s.compatSource)
  const setCompatSource = useAppStore(s => s.setCompatSource)
  // Tap sur un Handle de sortie (sans drag) → sheet 'compat'. Seuil 8px (cf. tapGuard).
  const connectStart = useRef<{ nodeId: string; handleId: string; handleType: string; x: number; y: number } | null>(null)
  const [engineFilter, setEngineFilter] = useState('all')
  const [showAdvanced, setShowAdvanced] = useState(false)
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

  const buildNode = useCallback((type: string, position: { x: number; y: number }, opts?: {
    children?: string[]
    fields?: Record<string, string>
  }): Node | null => {
    if (!catalog) return null
    const def = catalog.blocks[type]
    if (!def) return null
    const cat = catalog.categories.find(c => c.id === def.cat)
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const stage = def.stage ?? stageOfBlock(type, def.cat)
    const sbEntry = catalog.superblocks.find(s => s.id === type)
    const isSuper = Boolean(sbEntry)
    const nodeId = `${type}_${Date.now()}`
    return {
      id: nodeId,
      type: isSuper ? 'superblock' : 'block',
      dragHandle: '.block-drag-handle',
      position,
      data: {
        type,
        label,
        category: def.cat,
        categoryColor: cat?.color ?? theme.color.accent,
        segs: def.segs,
        fields: opts?.fields ?? segsToFields(def),
        inputs: def.inputs,
        outputs: def.outputs,
        children: sbEntry
          ? defaultChildren({ ...sbEntry, children: opts?.children ?? sbEntry.children }, catalog, nodeId)
          : (type === 'sequential_container' ? [] : undefined),
        stage,
        stage_name: def.stage_name,
      },
    }
  }, [catalog])

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target || !catalog) return
    connectStart.current = null
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

  const pointOf = (e: unknown): { x: number; y: number } => {
    const evt = e as { clientX?: number; clientY?: number; touches?: { clientX: number; clientY: number }[] } | undefined
    const t = evt?.touches?.[0]
    return { x: t?.clientX ?? evt?.clientX ?? 0, y: t?.clientY ?? evt?.clientY ?? 0 }
  }

  const onConnectStart = useCallback((_e: unknown, params: { nodeId?: string | null; handleId?: string | null; handleType?: string | null }) => {
    if (!params.nodeId || !params.handleId) { connectStart.current = null; return }
    const p = pointOf(_e)
    connectStart.current = {
      nodeId: params.nodeId,
      handleId: params.handleId,
      handleType: params.handleType ?? '',
      x: p.x,
      y: p.y,
    }
  }, [])

  const onConnectEnd = useCallback((e: unknown) => {
    const start = connectStart.current
    connectStart.current = null
    if (!start || start.handleType !== 'source') return
    const p = pointOf(e)
    if (Math.hypot(p.x - start.x, p.y - start.y) > 8) return
    setCompatSource({ nodeId: start.nodeId, port: start.handleId })
    setActiveSheet('compat')
  }, [setCompatSource, setActiveSheet])

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

  const warnMissingChildren = useCallback((requested: string[]) => {
    if (!catalog || requested.length === 0) return
    const available = new Set(availableChildren({ id: '', title: '', macro_stage: 0, engine: '', children: requested }, catalog))
    const missing = requested.filter(t => !available.has(t))
    if (missing.length > 0) {
      showToast({ kind: 'error', message: `Sous-bloc(s) indisponible(s) : ${missing.join(', ')}` })
    }
  }, [catalog, showToast])

  const addNodeAtCenter = useCallback((type: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const position = screenToFlowPosition({ x, y: y + (tapSeq.current++ % 6) * 22 })
    const node = buildNode(type, position)
    if (!node) return
    warnMissingChildren(catalog?.superblocks.find(s => s.id === type)?.children ?? [])
    useAppStore.getState().commitUndoPoint()
    addFlowNode(node)
    setActiveSheet(null)
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
  }, [buildNode, screenToFlowPosition, addFlowNode, fitView, setActiveSheet, catalog, warnMissingChildren])

  const addConfiguredNode = useCallback((type: string, children: string[]) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const position = screenToFlowPosition({ x, y: y + (tapSeq.current++ % 6) * 22 })
    const node = buildNode(type, position, { children })
    if (!node) return
    warnMissingChildren(children)
    useAppStore.getState().commitUndoPoint()
    addFlowNode(node)
    useAppStore.setState(s => ({
      flowNodes: s.flowNodes.map(n => ({ ...n, selected: n.id === node.id })),
    }))
    setActiveSheet('inspect')
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
  }, [buildNode, screenToFlowPosition, addFlowNode, fitView, setActiveSheet, warnMissingChildren])

  const addCompatNode = useCallback((type: string) => {
    const src = compatSource
    if (!src) return
    const store = useAppStore.getState()
    const srcNode = store.flowNodes.find(n => n.id === src.nodeId)
    const position = srcNode?.position
      ? { x: srcNode.position.x + 280, y: srcNode.position.y }
      : screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const node = buildNode(type, position)
    if (!node) return
    store.commitUndoPoint()
    addFlowNode(node)
    setActiveSheet(null)
    // Append-only : arête créée depuis le store frais (après l'ajout du nœud),
    // sans passer par onConnect dont la closure `flowNodes` serait périmée.
    const fresh = useAppStore.getState()
    const freshSrc = fresh.flowNodes.find(n => n.id === src.nodeId)
    const freshTgt = fresh.flowNodes.find(n => n.id === node.id)
    if (freshSrc && freshTgt) {
      const resolved = resolveConnection(
        portList(freshSrc, 'outputs'),
        portList(freshTgt, 'inputs'),
        src.port,
        null,
        graph,
      )
      if (resolved?.targetPort) {
        const edge: Edge = {
          id: `e-${node.id}-${resolved.targetPort}`,
          source: src.nodeId,
          target: node.id,
          sourceHandle: resolved.sourcePort,
          targetHandle: resolved.targetPort,
          type: 'flow',
          style: edgeStyleFor({ source: src.nodeId, target: node.id, sourceHandle: resolved.sourcePort, targetHandle: resolved.targetPort } as Edge, fresh.flowNodes, graph),
        }
        useAppStore.getState().addFlowEdges([edge])
      } else {
        showToast({ kind: 'error', message: "Aucun port d'entrée compatible sur la cible" })
      }
    }
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
  }, [compatSource, buildNode, screenToFlowPosition, addFlowNode, setActiveSheet, graph, showToast, fitView])

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
      const engineOf = (id: string | null | undefined) => {
        const n = flowNodes.find(n => n.id === id)
        const t = (n?.data as { type?: string } | undefined)?.type
        return (t && catalog?.blocks[t]?.engine) || 'generic'
      }
      const from = engineOf(e.source)
      const to = engineOf(e.target)
      const gradient = from !== to && from !== 'generic' && to !== 'generic' ? { from, to } : undefined
      const { style } = resolveEdgeStyle(base, gradient)
      return { ...e, type: 'flow' as const, style, data: { ...((e.data as object) ?? {}), gradient } }
    }),
    [flowEdges, flowNodes, graph, catalog]
  )

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    // Tap sur un port (Handle) → géré par onConnectStart/End ('compat'), pas l'inspecteur.
    if ((e.target as HTMLElement).closest?.('.react-flow__handle')) return
    setActiveSheet('inspect')
  }, [setActiveSheet])
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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
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

      {/* Unified Shadcn Drawer for Add, Inspect, and Journal */}
      <Drawer
        open={activeSheet !== null}
        onOpenChange={open => !open && setActiveSheet(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>
              {activeSheet === 'add'
                ? 'Ajouter un Super-Bloc'
                : activeSheet === 'config'
                ? 'Configurer le Super-Bloc'
                : activeSheet === 'compat'
                ? 'Blocs compatibles'
                : activeSheet === 'inspect'
                ? 'Inspecteur de Paramètres'
                : 'Journal d’Exécution'}
            </DrawerTitle>
            <DrawerDescription>Panneau de configuration du canvas</DrawerDescription>
          </DrawerHeader>
          <div className="p-6 min-h-0 h-full overflow-y-auto">
            {activeSheet === 'add' && catalog && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-foreground">Catalogue des Super-Blocs</h2>
                    <p className="text-sm text-muted-foreground">
                      Touchez une carte pour la configurer avant de l'ajouter au canvas.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground shrink-0">
                    Avancé
                    <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} aria-label="Mode avancé" />
                  </label>
                </div>
                <ToggleGroup
                  type="single"
                  value={engineFilter}
                  onValueChange={v => v && setEngineFilter(v)}
                  className="justify-start flex-wrap"
                >
                  {ENGINE_FILTERS.map(f => (
                    <ToggleGroupItem key={f.value} value={f.value} className="text-xs px-2.5 py-1">
                      {f.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {!showAdvanced ? (
                  groupSuperblocks(catalog.superblocks.filter(sb => matchEngine(sb.engine, engineFilter))).map(group => (
                    <div key={group.stage} className="flex flex-col gap-2">
                      <h3 className="text-sm font-heading font-bold text-foreground">
                        {(catalog.macro_stages?.find(m => m.id === group.stage)?.label) ?? MACRO_FALLBACK[group.stage] ?? `Étape ${group.stage}`}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.items.map(sb => (
                          <BlockCard
                            key={sb.id}
                            type={sb.id}
                            onClick={() => { setConfigTarget(sb.id); setActiveSheet('config') }}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {Object.keys(catalog.blocks)
                      .filter(t => matchEngine(catalog.blocks[t].engine, engineFilter))
                      .map(type => (
                        <BlockCard key={type} type={type} onClick={() => addNodeAtCenter(type)} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeSheet === 'config' && (configSb ? (
              <SuperBlockConfigSheet
                key={configSb.id}
                sb={configSb}
                onAdd={children => addConfiguredNode(configSb.id, children)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Super-Bloc introuvable.</p>
            ))}

            {activeSheet === 'compat' && (compatSource ? (
              <CompatSheet
                key={`${compatSource.nodeId}:${compatSource.port}`}
                nodeId={compatSource.nodeId}
                port={compatSource.port}
                onPick={addCompatNode}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Aucune sortie sélectionnée.</p>
            ))}

            {activeSheet === 'inspect' && <NodeInspector />}

            {activeSheet === 'journal' && <JournalPanel />}
          </div>
        </DrawerContent>
      </Drawer>
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

/** Carte SuperBlock BB (spec §5) : titre FR catalogue + badge moteur haut-droite. */

function NodeInspector() {
  const flowNodes = useAppStore(s => s.flowNodes)
  const catalog = useAppStore(s => s.catalog)
  const updateFlowParam = useAppStore(s => s.updateFlowParam)
  const updateNodeChildren = useAppStore(s => s.updateNodeChildren)
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const setCompatSource = useAppStore(s => s.setCompatSource)
  const setActiveSheet = useAppStore(s => s.setActiveSheet)
  const selected = flowNodes.find(n => n.selected)
  const data = selected?.data as Record<string, unknown> | undefined
  const type = (data?.type as string) ?? ''
  const def = type ? catalog?.blocks[type] : undefined
  const sbTitle = catalog?.superblocks.find(s => s.id === type)?.title
  const stageNum = (data?.stage as number) ?? def?.stage ?? 2
  const stageConfig = getStageConfig(stageNum)
  const fields = (data?.fields as Record<string, string>) ?? {}
  const sbEntry = catalog?.superblocks.find(s => s.id === type)
  const children = (data?.children as CatalogNode[] | undefined) ?? []
  const outputs = (data?.outputs as { name: string; dtype: string }[] | undefined) ?? []

  if (!selected) {
    return (
      <div className="flex flex-col gap-2 py-8 items-center text-center">
        <h2 className="text-lg font-heading font-bold text-foreground">Inspecteur</h2>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un bloc sur le canvas pour examiner et modifier ses paramètres.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-extrabold px-1.5 py-0.5 rounded border border-border"
          >
            {stageConfig.key}
          </Badge>
          <h2 className="text-lg font-heading font-bold text-foreground">{String(data?.label ?? selected.id)}</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {type}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {sbTitle ?? def?.description ?? 'Bloc fonctionnel'}
      </p>

      <Separator />

      {sbEntry && sbEntry.children.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-heading font-bold text-foreground">Sous-blocs</h3>
          {sbEntry.children.map(childType => {
            const child = children.find(c => c.type === childType)
            const on = Boolean(child)
            const missing = !catalog?.blocks[childType]
            const label = catalog?.blocks[childType]?.segs.find(s => s.t === 'text')?.v ?? childType
            return (
              <label
                key={childType}
                className={`flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card cursor-pointer min-h-11 ${on ? '' : 'opacity-55'}`}
              >
                <Checkbox
                  checked={on}
                  disabled={missing}
                  onCheckedChange={() => {
                    if (!selected) return
                    if (child) {
                      updateNodeChildren(selected.id, children.filter(c => c.type !== childType))
                    } else if (catalog) {
                      const fresh = defaultChildren(
                        { ...sbEntry, children: [childType] },
                        catalog,
                        selected.id,
                      )
                      updateNodeChildren(selected.id, [...children, ...fresh])
                    }
                  }}
                  aria-label={label}
                />
                <span className="text-sm font-bold text-foreground flex-1">{label}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {missing ? 'indisponible' : on ? 'inclus' : 'exclu'}
                </Badge>
              </label>
            )
          })}
        </div>
      )}

      {outputs.length > 0 && selected && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-heading font-bold text-foreground">Blocs suivants</h3>
          {outputs.map(o => (
            <Button
              key={o.name}
              variant="outline"
              className="justify-between font-bold text-xs min-h-11"
              onClick={() => { setCompatSource({ nodeId: selected.id, port: o.name }); setActiveSheet('compat') }}
            >
              <span>Voir après « {o.name} »</span>
              <ChevronRight className="size-4" />
            </Button>
          ))}
        </div>
      )}

      {def && def.segs.filter(s => s.t !== 'text').length > 0 && (
        <>
          <Separator />
          <h3 className="text-base font-heading font-bold text-foreground">Paramètres</h3>
          <div className="grid grid-cols-3 items-start gap-x-3">
            <BlockSegments
              segs={def.segs}
              fields={fields}
              blockId={selected.id}
              blockType={type}
              onUpdate={updateFlowParam}
            />
          </div>
        </>
      )}

      <Separator />
      <Button
        variant="outline"
        className="w-full justify-center gap-2 font-bold text-xs text-destructive"
        onClick={() => { removeFlowNode(selected.id); setActiveSheet(null) }}
      >
        Supprimer le bloc
      </Button>
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
