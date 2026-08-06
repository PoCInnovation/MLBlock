import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import useAppStore from '../../store/useAppStore'
import BlockSegments from '../blocks/BlockSegments'
import { theme } from '../../theme'
import { resolveColumnsForPath, resolveFlowSourcePath } from '../../utils/columns'
import type { Port, Segment } from '../../types/catalog'

const nodeStyle: React.CSSProperties = {
  background: theme.color.surface2,
  borderRadius: theme.radius.md,
  padding: '10px 14px',
  minWidth: 180,
  maxWidth: 260,
  boxShadow: theme.shadow.block,
  border: `1px solid rgba(255,255,255,.08)`,
  fontFamily: theme.font.body,
  fontSize: 13,
  color: theme.color.text,
}

const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: theme.color.accent,
  border: `2px solid ${theme.color.surface2}`,
}

const labelStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 6,
  fontSize: 14,
}

const segmentsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
  color: theme.color.textMuted,
  fontSize: 12,
}

type BlockNodeData = {
  type: string
  label: string
  category: string
  categoryColor: string
  segs: Segment[]
  fields: Record<string, string>
  inputs: Port[]
  outputs: Port[]
}

/** Distribute N handles vertically on a side. */
function topFor(i: number, n: number): string {
  return `${((i + 1) * 100) / (n + 1)}%`
}

function BlockNode({ data, id }: NodeProps<BlockNodeData>) {
  const updateFlowParam = useAppStore(s => s.updateFlowParam)
  const flowNodes = useAppStore(s => s.flowNodes)
  const flowEdges = useAppStore(s => s.flowEdges)
  const [columnOptions, setColumnOptions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    setColumnOptions({})
    const hasTarget = data.segs.some(s => 'k' in s && s.k === 'target_column')
    if (!hasTarget) return
    const path = resolveFlowSourcePath(flowNodes, flowEdges, id)
    if (!path) return
    let cancelled = false
    resolveColumnsForPath(path).then(cols => {
      if (cols && !cancelled) setColumnOptions({ target_column: cols })
    })
    return () => { cancelled = true }
  }, [id, data.segs, flowNodes, flowEdges])

  return (
    <div style={{ ...nodeStyle, borderTop: `3px solid ${data.categoryColor}` }}>
      {data.inputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="target"
          position={Position.Left}
          style={{ ...handleStyle, top: topFor(i, arr.length) }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
      <div style={labelStyle}>{data.label}</div>
      <div style={segmentsStyle}>
        <BlockSegments segs={data.segs} fields={data.fields} blockId={id} onUpdate={updateFlowParam} columnOptions={columnOptions} />
      </div>
      {data.outputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="source"
          position={Position.Right}
          style={{ ...handleStyle, top: topFor(i, arr.length) }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
    </div>
  )
}

export default memo(BlockNode)
