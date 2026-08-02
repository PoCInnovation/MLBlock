import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { theme } from '../../theme'

const nodeStyle: React.CSSProperties = {
  background: theme.color.surface2,
  borderRadius: theme.radius.md,
  padding: '10px 14px',
  minWidth: 140,
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
  marginBottom: 4,
  fontSize: 14,
}

const paramStyle: React.CSSProperties = {
  fontSize: 11,
  color: theme.color.textMuted,
}

type BlockNodeData = {
  type: string
  label: string
  category: string
  categoryColor: string
  params: Record<string, { type: string; default?: unknown }>
}

function BlockNode({ data }: NodeProps<BlockNodeData>) {
  return (
    <div style={{ ...nodeStyle, borderTop: `3px solid ${data.categoryColor}` }}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div style={labelStyle}>{data.label}</div>
      <div style={paramStyle}>
        {Object.entries(data.params).map(([k, v]) => (
          <div key={k}>{k}: {v.type}</div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

export default memo(BlockNode)
