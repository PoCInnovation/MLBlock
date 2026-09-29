import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Badge, Card, Heading, HStack, Divider } from '@astryxdesign/core'
import { Database, Layers } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { getStageConfig } from '../../utils/stages'
import { theme } from '../../theme'
import {
  SUPER_BLOCK_REGISTRY,
  type SuperBlockNodeData,
} from './superBlockRegistry'

function topFor(i: number, n: number): string {
  return `${((i + 1) * 100) / (n + 1)}%`
}

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
      className="bg-surface2! min-w-[280px] max-w-[340px] overflow-visible! rounded-2xl! shadow-lg"
      style={{
        borderTop: `4px solid ${stageConfig.color}`,
        borderLeft: `1px solid ${stageConfig.color}33`,
        borderRight: `1px solid ${stageConfig.color}33`,
        borderBottom: `1px solid ${stageConfig.color}33`,
      }}
    >
      {/* Unified Header */}
      <HStack justify="between" align="center" gap={2} style={{ paddingBottom: 6 }}>
        <HStack align="center" gap={2} style={{ minWidth: 0 }}>
          <Badge
            label={stageConfig.key}
            style={{
              backgroundColor: `${stageConfig.color}22`,
              color: stageConfig.color,
              border: `1px solid ${stageConfig.color}66`,
              fontSize: 10,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 4,
            }}
          />
          <Heading
            level={4}
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--color-text-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
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
          <g fill="var(--color-text-muted)">
            <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
            <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
            <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
          </g>
        </svg>
      </HStack>

      {def.subtitle && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          {def.stage === 0 ? <Database size={12} className="text-success" /> : <Layers size={12} className="text-accent" />}
          <span>{def.subtitle}</span>
        </div>
      )}

      <Divider orientation="horizontal" style={{ margin: '4px 0 8px 0' }} />

      {/* Specialized Body */}
      <BodyComponent
        id={id}
        data={data}
        updateFlowParam={updateFlowParam}
        inputFed={inputFed}
        outputFed={outputFed}
      />

      <Divider orientation="horizontal" style={{ margin: '8px 0 6px 0' }} />

      {/* Unified Footer */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          className="border-none bg-transparent text-text-muted font-bold text-[10px] cursor-pointer hover:text-error"
          onClick={() => removeFlowNode(id)}
        >
          Supprimer
        </button>
      </div>

      {/* Dynamic Input Handles */}
      {def.inputs.map((slot, idx) => (
        <Handle
          key={slot.id}
          id={slot.id}
          type="target"
          position={Position.Left}
          className="w-[14px]! h-[14px]! rounded-full! border-2! border-surface2!"
          style={{
            top: def.inputs.length === 1 ? '50%' : topFor(idx, def.inputs.length),
            backgroundColor: inputFed[slot.id] ? theme.color.success : slot.color,
          }}
          title={`${slot.label}: ${slot.dtype}`}
        />
      ))}

      {/* Dynamic Output Handles */}
      {def.outputs.map((slot, idx) => (
        <Handle
          key={slot.id}
          id={slot.id}
          type="source"
          position={Position.Right}
          className="w-[14px]! h-[14px]! rounded-full! border-2! border-surface2!"
          style={{
            top: def.outputs.length === 1 ? '50%' : topFor(idx, def.outputs.length),
            backgroundColor: outputFed[slot.id] ? theme.color.success : slot.color,
          }}
          title={`${slot.label}: ${slot.dtype}`}
        />
      ))}
    </Card>
  )
}

export default memo(SuperBlockNode)
