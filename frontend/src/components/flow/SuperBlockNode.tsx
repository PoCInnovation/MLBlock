import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    <Card className="bg-surface2 min-w-70 max-w-85 overflow-visible rounded-2xl shadow-lg border-t-4 p-3 border-border">
      {/* Unified Header */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
          >
            {stageConfig.key}
          </Badge>
          <h4 className="text-sm font-extrabold text-text-light truncate m-0">
            {data.label || def.title}
          </h4>
        </div>

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
      </div>

      {def.subtitle && (
        <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
          {def.stage === 0 ? <Database className="w-3.5 h-3.5 text-accent" /> : <Layers className="w-3.5 h-3.5 text-accent" />}
          <span>{def.subtitle}</span>
        </div>
      )}

      <Separator className="my-1.5" />
      {/* Blueprint Input Slots */}
      {def.inputs.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {def.inputs.map(slot => (
            <div
              key={slot.id}
              className={`text-xs font-bold px-2 py-1 rounded bg-surface border border-border relative flex items-center justify-between ${inputFed[slot.id] ? 'text-success' : 'text-text-muted'}`}
            >
              <span>{slot.label}</span>
              <span className="text-[10px] opacity-75">{slot.dtype}</span>
              <Handle
                type="target"
                position={Position.Left}
                id={slot.id}
                className={`!w-3.5 !h-3.5 !rounded-full border-2 !absolute !-left-2 !top-1/2 !-translate-y-1/2 ${inputFed[slot.id] ? '!bg-success' : '!bg-accent'} !border-surface2`}
                title={`${slot.label}: ${slot.dtype}`}
              />
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
          {def.outputs.map(slot => (
            <div
              key={slot.id}
              className={`text-xs font-bold px-2 py-1 rounded bg-surface border border-border relative flex items-center justify-between ${outputFed[slot.id] ? 'text-success' : 'text-text-muted'}`}
            >
              <span>{slot.label}</span>
              <span className="text-[10px] opacity-75">{slot.dtype}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={slot.id}
                className={`!w-3.5 !h-3.5 !rounded-full border-2 !absolute !-right-2 !top-1/2 !-translate-y-1/2 ${outputFed[slot.id] ? '!bg-success' : '!bg-accent'} !border-surface2`}
                title={`${slot.label}: ${slot.dtype}`}
              />
            </div>
          ))}
        </div>
      )}

      <Separator className="my-2" />

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
