import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Badge, Card, Heading, HStack, Divider } from '@astryxdesign/core'
import { Database, Layers } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { getStageConfig } from '../../utils/stages'
import {
  SUPER_BLOCK_REGISTRY,
  type SuperBlockNodeData,
} from './superBlockRegistry'

function SuperBlockNode({ data, id }: NodeProps<Node<SuperBlockNodeData>>) {
  const updateFlowParam = useAppStore(s => s.updateFlowParam)
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const { flowEdges } = useAppStore(useShallow(s => ({ flowEdges: s.flowEdges })))

  const def = SUPER_BLOCK_REGISTRY[data.type]
  const stageConfig = getStageConfig(def?.stage ?? data.stage ?? 2)

  const inputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.target === id).map(e => [e.targetHandle ?? 'in_1', true])),
    [flowEdges, id],
  )

  const outputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.source === id).map(e => [e.sourceHandle ?? 'out_1', true])),
    [flowEdges, id],
  )

  if (!def) return null

  const BodyComponent = def.Body

  return (
    <Card
      padding={3}
      variant="default"
      elevation="low"
      className="!bg-surface2 min-w-70 max-w-85 !overflow-visible !rounded-2xl shadow-lg border-t-4"
    >
      {/* Unified Header */}
      <HStack justify="between" align="center" gap={2} className="pb-1.5">
        <HStack align="center" gap={2} className="min-w-0">
          <Badge
            label={stageConfig.key}
            className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
          />
          <Heading
            level={4}
            className="text-sm font-extrabold text-text-light truncate"
          >
            {data.label || def.title}
          </Heading>
        </HStack>

        <svg
          className="block-drag-handle cursor-grab"
          width={12}
          height={16}
          viewBox="0 0 12 16"
          aria-label={`Déplacer ${def.title}`}
        >
          <g className="fill-text-muted">
            <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
            <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
            <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
          </g>
        </svg>
      </HStack>

      {def.subtitle && (
        <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
          {def.stage === 0 ? <Database size={12} className="text-success" /> : <Layers size={12} className="text-accent" />}
          <span>{def.subtitle}</span>
        </div>
      )}

      <Divider orientation="horizontal" className="my-1.5" />
      {/* Blueprint Input Slots */}
      {def.inputs.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-text-muted px-1 flex justify-between items-center">
            <span>Entrées :</span>
            <span className={def.inputs.every(s => inputFed[s.id]) ? 'text-success' : 'text-warning'}>
              {def.inputs.filter(s => inputFed[s.id]).length}/{def.inputs.length} prêtes
            </span>
          </div>
          {def.inputs.map(slot => (
            <div
              key={slot.id}
              className="relative flex items-center justify-between pl-4 pr-2 py-1.5 rounded-md bg-surface border border-border"
            >
              <Handle
                id={slot.id}
                type="target"
                position={Position.Left}
                className="!w-3.5 !h-3.5 !rounded-full border-2 !absolute !-left-2 !top-1/2 !-translate-y-1/2"
                title={`${slot.label}: ${slot.dtype}`}
              />
              <span className="font-bold text-xs text-text">{slot.label}</span>
              <span className="font-mono text-xs text-text-muted">({slot.dtype})</span>
            </div>
          ))}
        </div>
      )}

      {/* Specialized Body */}
      <BodyComponent
        id={id}
        data={data}
        updateFlowParam={updateFlowParam}
        inputFed={inputFed}
        outputFed={outputFed}
      />

      {/* Blueprint Output Slots */}
      {def.outputs.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-text-muted px-1">
            Sorties :
          </div>
          {def.outputs.map(slot => (
            <div
              key={slot.id}
              className="relative flex items-center justify-between pl-2 pr-4 py-1.5 rounded-md bg-surface border border-border"
            >
              <span className="font-bold text-xs text-text">{slot.label}</span>
              <span className="font-mono text-xs text-text-muted">({slot.dtype})</span>
              <Handle
                id={slot.id}
                type="source"
                position={Position.Right}
                className="!w-3.5 !h-3.5 !rounded-full border-2 !absolute !-right-2 !top-1/2 !-translate-y-1/2"
                title={`${slot.label}: ${slot.dtype}`}
              />
            </div>
          ))}
        </div>
      )}

      <Divider orientation="horizontal" className="my-2" />

      {/* Unified Footer */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          className="border-none bg-transparent text-text-muted font-bold text-xs cursor-pointer hover:text-error"
          onClick={() => removeFlowNode(id)}
        >
          Supprimer
        </button>
      </div>
    </Card>
  )
}

export default memo(SuperBlockNode)
