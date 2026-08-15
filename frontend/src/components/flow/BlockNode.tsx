import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import useAppStore from '../../store/useAppStore'
import BlockSegments from '../blocks/BlockSegments'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { resolveColumnsForPath, resolveFlowSourcePath } from '../../utils/columns'
import type { Port, Segment } from '../../types/catalog'

// Taille/bordure du handle : classes !important car le CSS ReactFlow
// (non-layé) écraserait les utilitaires Tailwind sinon.
const handleClassName = 'w-[14px]! h-[14px]! rounded-full! bg-accent! border-2! border-surface2!'

const outputsClassName = 'flex flex-col gap-0.5 text-[11px] font-bold text-text-muted'

const inputsClassName = `${outputsClassName} mb-2`

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
      className="bg-surface2! shadow-block min-w-[180px] max-w-[260px] overflow-visible! px-lg! pb-lg! rounded-2xl!"
      style={{
        borderTop: `3px solid ${data.categoryColor}`,
        width: viewMode === 'grid' ? 244 : undefined,
      }}
    >
      <CardHeader>
        <div>
          <CardTitle>{data.label}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <CardAction>
          <svg
            className="block-drag-handle cursor-grab"
            width={12}
            height={16}
            viewBox="0 0 12 16"
            aria-label="Déplacer le bloc"
          >
            <g fill="var(--color-text-muted)">
              <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
              <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
              <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
            </g>
          </svg>
        </CardAction>
      </CardHeader>
      {(data.inputs.length > 0 || data.outputs.length > 0) && (
        <CardContent className="flex-1 min-h-0">
          {data.inputs.length > 0 && data.outputs.length > 0 ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <div className={inputsClassName}>
                {data.inputs.map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
              </div>
              <Separator orientation="vertical" />
              <div className={outputsClassName}>
                {data.outputs.map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
              </div>
            </div>
          ) : (
            <div className={data.inputs.length > 0 ? inputsClassName : outputsClassName}>
              {(data.inputs.length > 0 ? data.inputs : data.outputs).map(p => <div key={p.name}>{p.name} · {p.dtype}</div>)}
            </div>
          )}
        </CardContent>
      )}
      {data.segs.length > 0 && (
        <CardFooter className="flex flex-col items-stretch gap-2 -mx-lg border-t border-border bg-white/3 p-2 rounded-b-2xl text-[12px] font-extrabold text-text-muted">
          <BlockSegments segs={data.segs} fields={data.fields} blockId={id} blockType={data.type} onUpdate={updateFlowParam} columnOptions={columnOptions} />
          <div className="flex justify-end">
            <button className="block-delete-btn border-none bg-none text-text-muted font-extrabold text-[11px] cursor-pointer p-0 font-body" onClick={() => removeFlowNode(id)}>Supprimer</button>
          </div>
        </CardFooter>
      )}
      {data.inputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="target"
          position={Position.Left}
          className={handleClassName}
          style={{ top: topFor(i, arr.length) }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
      {data.outputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="source"
          position={Position.Right}
          className={handleClassName}
          style={{ top: topFor(i, arr.length) }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
    </Card>
  )
}

export default memo(BlockNode)
