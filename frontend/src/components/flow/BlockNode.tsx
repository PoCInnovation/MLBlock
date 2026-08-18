import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import useAppStore from '../../store/useAppStore'
import BlockSegments from '../blocks/BlockSegments'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { resolveColumnsForPath, resolveFlowSourcePath } from '../../utils/columns'
import { isAmbiguous } from '../../utils/portResolution'
import { theme } from '../../theme'
import type { Port, Segment } from '../../types/catalog'

// Taille/bordure du handle : classes !important car le CSS ReactFlow
// (non-layé) écraserait les utilitaires Tailwind sinon.
const handleClassName = 'w-[14px]! h-[14px]! rounded-full! bg-accent! border-2! border-surface2!'
const handleFedClassName = 'w-[14px]! h-[14px]! rounded-full! bg-success! border-2! border-surface2!'

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
  const [columnOptions, setColumnOptions] = useState<Record<string, string[]>>({})
  const description = catalog?.blocks[data.type]?.description

  // Ports fournis (état dérivé des edges — jamais stocké) : un input est
  // fourni s'il a une edge entrante, un output s'il a une edge sortante.
  const inputFed: Record<string, true> = Object.fromEntries(flowEdges.filter(e => e.target === id).map(e => [e.targetHandle ?? 'in_1', true]))
  const outputFed: Record<string, true> = Object.fromEntries(flowEdges.filter(e => e.source === id).map(e => [e.sourceHandle ?? 'out_1', true]))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset synchrone volontaire : évite d'afficher les colonnes périmées de l'ancien chemin pendant le fetch.
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
      {(data.inputs.length > 0 || data.outputs.length > 0 || data.segs.length > 0) && (
        <CardContent className="flex-1 min-h-0">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-3">
            {data.inputs.length > 0 && (
              <div className={inputsClassName} style={{ gridColumn: 1, gridRow: 1 }}>
                {data.inputs.map(p => (
                  <div key={p.name} style={inputFed[p.name] ? { color: theme.color.success } : undefined}>
                    {p.name} · {p.dtype}
                  </div>
                ))}
              </div>
            )}
            {data.outputs.length > 0 && (
              <div className={outputsClassName} style={{ gridColumn: 3, gridRow: 1 }}>
                {data.outputs.map(p => (
                  <div key={p.name} style={outputFed[p.name] ? { color: theme.color.success } : undefined}>
                    {p.name} · {p.dtype}
                  </div>
                ))}
              </div>
            )}
            {(() => {
              const paramCount = data.segs.filter(s => s.t !== 'text').length
              const hasBody = data.inputs.length > 0 || data.outputs.length > 0
              const hasParams = paramCount > 0
              const sepRow = hasBody && hasParams ? 2 : 0
              return (
                <>
                  {sepRow > 0 && (
                    // Ligne horizontale body/params : une vraie rangée col-span-3
                    // (pleine largeur) plutôt qu'un borderTop sur chaque cellule —
                    // le borderTop par cellule était décalé en escalier car le
                    // label et le champ n'ont pas la même hauteur.
                    <Separator orientation="horizontal" style={{ gridColumn: '1 / -1', gridRow: sepRow, margin: '8px 0' }} />
                  )}
                  {data.segs.length > 0 && (
                    <BlockSegments segs={data.segs} fields={data.fields} blockId={id} blockType={data.type} onUpdate={updateFlowParam} columnOptions={columnOptions} startRow={hasBody ? (hasParams ? 3 : 1) : 1} />
                  )}
                  {(() => {
                    // Séparateur vertical unique : traverse body + ligne
                    // horizontale + params, quel que soit le contenu du bloc.
                    if (!hasBody && !hasParams) return null
                    const totalRows = (hasBody ? 1 : 0) + (sepRow > 0 ? 1 : 0) + paramCount
                    return <Separator orientation="vertical" style={{ gridColumn: 2, gridRow: `1 / ${totalRows + 1}` }} />
                  })()}
                </>
              )
            })()}
            <div className="col-span-3 flex justify-end pt-2">
              <button className="block-delete-btn border-none bg-none text-text-muted font-extrabold text-[11px] cursor-pointer p-0 font-body" onClick={() => removeFlowNode(id)}>Supprimer</button>
            </div>
          </div>
        </CardContent>
      )}
      {data.inputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="target"
          position={Position.Left}
          className={inputFed[p.name] ? handleFedClassName : handleClassName}
          // Côté non-ambigu : tous les handles sont empilés au centre (50%),
          // un seul visible (i === 0) — ReactFlow positionne les edges sur
          // les handles présents, ils doivent donc rester dans le DOM.
          style={{
            top: isAmbiguous(data.inputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(data.inputs) || i === 0 ? 1 : 0,
            pointerEvents: isAmbiguous(data.inputs) || i === 0 ? undefined : 'none',
          }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
      {data.outputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="source"
          position={Position.Right}
          className={outputFed[p.name] ? handleFedClassName : handleClassName}
          style={{
            top: isAmbiguous(data.outputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(data.outputs) || i === 0 ? 1 : 0,
            pointerEvents: isAmbiguous(data.outputs) || i === 0 ? undefined : 'none',
          }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
    </Card>
  )
}

export default memo(BlockNode)
