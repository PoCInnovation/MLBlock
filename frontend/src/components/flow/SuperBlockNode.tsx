import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useAppStore from '../../store/useAppStore'
import { getStageConfig } from '../../utils/stages'
import type { PipelineNode } from '../../types/catalog'

export type SuperBlockNodeData = {
  type: string
  label?: string
  fields?: Record<string, string>
  children?: PipelineNode[]
  inputs?: { name: string; dtype: string }[]
  outputs?: { name: string; dtype: string }[]
  stage?: number
}

/** Nœud SuperBlock piloté catalogue (titres FR, ports et enfants du backend). */
function SuperBlockNode({ data, id }: NodeProps<Node<SuperBlockNodeData>>) {
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const catalog = useAppStore(s => s.catalog)
  const { flowEdges } = useAppStore(useShallow(s => ({ flowEdges: s.flowEdges })))

  const sb = catalog?.superblocks.find(s => s.id === data.type)
  const def = data.type ? catalog?.blocks[data.type] : undefined
  const stageConfig = getStageConfig(data.stage ?? def?.stage ?? 2)

  const inputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.target === id).map(e => [e.targetHandle ?? 'in_1', true])),
    [flowEdges, id],
  )

  const outputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.source === id).map(e => [e.sourceHandle ?? 'out_1', true])),
    [flowEdges, id],
  )

  if (!sb || !def) {
    return (
      <Card className="bg-surface2 min-w-70 max-w-85 rounded-2xl p-3 border-error">
        <h4 className="text-sm font-extrabold text-error m-0">
          Super-Bloc inconnu : {data.type}
        </h4>
        <p className="text-xs text-text-muted mt-1">
          Absent du catalogue — reconnecte-toi ou recharge le projet.
        </p>
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

  const inputs = data.inputs ?? def.inputs
  const outputs = data.outputs ?? def.outputs
  const children: PipelineNode[] = data.children ?? []

  const slotRow = (
    port: { name: string; dtype: string },
    side: 'target' | 'source',
    fed: Record<string, boolean>,
  ) => (
    <div
      key={port.name}
      className={`text-xs font-bold px-2 py-1 rounded bg-surface border border-border relative flex items-center justify-between ${fed[port.name] ? 'text-success' : 'text-text-muted'}`}
    >
      <span>{port.name}</span>
      <span className="text-[10px] opacity-75">{port.dtype}</span>
      <Handle
        type={side}
        position={side === 'target' ? Position.Left : Position.Right}
        id={port.name}
        className={`!w-3.5 !h-3.5 !rounded-full border-2 !absolute ${side === 'target' ? '!-left-2' : '!-right-2'} !top-1/2 !-translate-y-1/2 ${fed[port.name] ? '!bg-success' : '!bg-accent'} !border-surface2`}
        title={`${port.name}: ${port.dtype}`}
      />
    </div>
  )

  return (
    <Card className="bg-surface2 min-w-70 max-w-85 overflow-visible rounded-2xl shadow-lg border-t-4 p-3 border-border">
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
          >
            {stageConfig.key}
          </Badge>
          <h4 className="text-sm font-extrabold text-text-light truncate m-0">
            {data.label || sb.title}
          </h4>
        </div>

        <svg
          className="block-drag-handle cursor-grab"
          width={12}
          height={16}
          viewBox="0 0 12 16"
          aria-label={`Déplacer ${sb.title}`}
        >
          <g className="fill-text-muted">
            <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
            <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
            <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
          </g>
        </svg>
      </div>

      {children.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {children.map(c => (
            <Badge key={c.id} variant="secondary" className="text-[10px]">
              {catalog?.blocks[c.type]?.segs.find(s => s.t === 'text')?.v ?? c.type}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-1.5" />
      {inputs.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {inputs.map(p => slotRow(p, 'target', inputFed))}
        </div>
      )}

      {outputs.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {outputs.map(p => slotRow(p, 'source', outputFed))}
        </div>
      )}

      <Separator className="my-2" />

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
