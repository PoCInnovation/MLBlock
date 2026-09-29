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

      {/* Blueprint Input Slots */}
      {def.inputs.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted px-1 flex justify-between items-center">
            <span>Entrées :</span>
            <span style={{ color: def.inputs.every(s => inputFed[s.id]) ? theme.color.success : theme.color.warning }}>
              {def.inputs.filter(s => inputFed[s.id]).length}/{def.inputs.length} prêtes
            </span>
          </div>
          {def.inputs.map(slot => (
            <div
              key={slot.id}
              className="relative flex items-center justify-between pl-4 pr-2 py-1.5 rounded-md bg-surface1 border border-border"
            >
              <Handle
                id={slot.id}
                type="target"
                position={Position.Left}
                className="w-[14px]! h-[14px]! rounded-full! border-2! !absolute !-left-[7px] !top-1/2 !-translate-y-1/2"
                style={{
                  borderColor: slot.color,
                  backgroundColor: inputFed[slot.id] ? slot.color : '#13151c',
                  boxShadow: inputFed[slot.id] ? `0 0 8px ${slot.color}` : 'none',
                }}
                title={`${slot.label}: ${slot.dtype}`}
              />
              <span className="font-bold text-[11.5px] text-text">{slot.label}</span>
              <span className="font-mono text-[10px] text-text-muted">({slot.dtype})</span>
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
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted px-1">
            Sorties :
          </div>
          {def.outputs.map(slot => (
            <div
              key={slot.id}
              className="relative flex items-center justify-between pl-2 pr-4 py-1.5 rounded-md bg-surface1 border border-border"
            >
              <span className="font-bold text-[11.5px] text-text">{slot.label}</span>
              <span className="font-mono text-[10px] text-text-muted">({slot.dtype})</span>
              <Handle
                id={slot.id}
                type="source"
                position={Position.Right}
                className="w-[14px]! h-[14px]! rounded-full! border-2! !absolute !-right-[7px] !top-1/2 !-translate-y-1/2"
                style={{
                  borderColor: slot.color,
                  backgroundColor: outputFed[slot.id] ? slot.color : '#13151c',
                  boxShadow: outputFed[slot.id] ? `0 0 8px ${slot.color}` : 'none',
                }}
                title={`${slot.label}: ${slot.dtype}`}
              />
            </div>
          ))}
        </div>
      )}

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
    </Card>
  )
}

export default memo(SuperBlockNode)
