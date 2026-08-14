import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import useAppStore from '../../store/useAppStore'
import BlockSegments from '../blocks/BlockSegments'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { theme } from '../../theme'
import { resolveColumnsForPath, resolveFlowSourcePath } from '../../utils/columns'
import type { Port, Segment } from '../../types/catalog'

const handleStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: theme.color.accent,
  border: `2px solid ${theme.color.surface2}`,
  // Le hover agrandit le handle (le CSS) — zone d'attrapage plus large.
}

const outputsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 11,
  fontWeight: 700,
  color: theme.color.textMuted,
}

const inputsStyle: React.CSSProperties = {
  ...outputsStyle,
  marginBottom: 8,
}

const segmentsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
  color: theme.color.textMuted,
  fontSize: 12,
}

const deleteBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: theme.color.textMuted,
  fontWeight: 800,
  fontSize: 11,
  cursor: 'pointer',
  padding: 0,
  fontFamily: theme.font.body,
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
    <Card
      size="sm"
      style={{
        background: theme.color.surface2,
        borderTop: `3px solid ${data.categoryColor}`,
        boxShadow: theme.shadow.block,
        minWidth: 180,
        maxWidth: 260,
        width: viewMode === 'grid' ? 244 : undefined,
        overflow: 'visible', // les Handles dépassent des bords
      }}
    >
      <CardHeader className="block-drag-handle" style={{ cursor: 'grab' }}>
        <div>
          <CardTitle>{data.label}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <div style={{ display: 'flex', gap: 12 }}>
        <CardContent style={{ flex: 1, minWidth: 0, padding: 0 }}>
          {data.inputs.length > 0 && (
            <div style={inputsStyle}>
              {data.inputs.map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
            </div>
          )}
          <div style={segmentsStyle}>
            <BlockSegments segs={data.segs} fields={data.fields} blockId={id} blockType={data.type} onUpdate={updateFlowParam} columnOptions={columnOptions} />
          </div>
        </CardContent>
        {data.outputs.length > 0 && (
          <>
            <Separator orientation="vertical" />
            <CardContent style={{ flex: '0 0 auto', padding: 0 }}>
              <div style={outputsStyle}>
                {data.outputs.map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
              </div>
            </CardContent>
          </>
        )}
      </div>
      <CardFooter style={{ margin: '0 -12px' }}>
        <CardAction style={{ marginLeft: 'auto' }}>
          <button className="block-delete-btn" style={deleteBtnStyle} onClick={() => removeFlowNode(id)}>Supprimer</button>
        </CardAction>
      </CardFooter>
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
    </Card>
  )
}

export default memo(BlockNode)
