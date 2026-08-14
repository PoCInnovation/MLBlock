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
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: theme.color.accent,
  border: `2px solid ${theme.color.surface2}`,
  // Le hover agrandit le handle (le CSS) — zone d'attrapage plus large.
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

const outputStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginTop: 8,
  fontSize: 11,
  fontWeight: 700,
  color: theme.color.textMuted,
}

const inputStyle: React.CSSProperties = {
  ...outputStyle,
  marginTop: 0,
  marginBottom: 8,
}

const deleteBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,.1)',
  color: theme.color.textMuted,
  fontWeight: 900,
  fontSize: 11,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
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
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const catalog = useAppStore(s => s.catalog)
  const flowNodes = useAppStore(s => s.flowNodes)
  const flowEdges = useAppStore(s => s.flowEdges)
  const viewMode = useAppStore(s => s.viewMode)
  const [columnOptions, setColumnOptions] = useState<Record<string, string[]>>({})
  const description = catalog?.blocks[data.type]?.description

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
    <div style={{ ...nodeStyle, borderTop: `3px solid ${data.categoryColor}`, width: viewMode === 'grid' ? 244 : undefined }}>
      <button style={deleteBtnStyle} onClick={() => removeFlowNode(id)} title="Supprimer le bloc">×</button>
      {data.inputs.length > 0 && (
        <div style={inputStyle}>
          {data.inputs.map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
        </div>
      )}
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
      <div style={labelStyle} title={description || undefined}>{data.label}</div>
      <div style={segmentsStyle}>
        <BlockSegments segs={data.segs} fields={data.fields} blockId={id} blockType={data.type} onUpdate={updateFlowParam} columnOptions={columnOptions} />
      </div>
      {data.outputs.length > 0 && (
        <div style={outputStyle}>
          {data.outputs.map(p => (
            <div key={p.name}>{p.name} · {p.dtype}</div>
          ))}
        </div>
      )}
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
