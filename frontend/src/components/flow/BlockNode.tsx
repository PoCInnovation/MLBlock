import { memo, useEffect, useMemo, useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useAppStore from '../../store/useAppStore'
import BlockSegments from '../blocks/BlockSegments'
import { resolveColumnsForPath, resolveFlowSourcePath } from '../../utils/columns'
import SuperBlockNode from './SuperBlockNode'
import { isAmbiguous } from '../../utils/portResolution'
import { getStageConfig, stageOfBlock } from '../../utils/stages'
import { TRANSITION_GRADIENT, engineColor } from '../../utils/superblocks'
import type { Port, Segment } from '../../types/catalog'

// Taille/bordure du handle : classes !important car le CSS ReactFlow
// (non-layé) écraserait les utilitaires Tailwind sinon.
const handleClassName = '!w-3.5 !h-3.5 !rounded-full !bg-accent !border-2 !border-surface2'
const handleFedClassName = '!w-3.5 !h-3.5 !rounded-full !bg-success !border-2 !border-surface2'

const outputsClassName = 'flex flex-col gap-0.5 text-xs font-bold text-text-muted'

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
  stage?: number
  stage_name?: string
}

/** Distribute N handles vertically on a side. */
function topFor(i: number, n: number): string {
  return `${((i + 1) * 100) / (n + 1)}%`
}

function StandardBlockNode({ data, id }: NodeProps<Node<BlockNodeData>>) {
  const updateFlowParam = useAppStore(s => s.updateFlowParam)
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const catalog = useAppStore(s => s.catalog)
  const { flowNodes, flowEdges } = useAppStore(useShallow(s => ({ flowNodes: s.flowNodes, flowEdges: s.flowEdges })))
  const [columnOptions, setColumnOptions] = useState<Record<string, string[]>>({})
  const description = catalog?.blocks[data.type]?.description
  const stageNum = data.stage ?? catalog?.blocks[data.type]?.stage ?? stageOfBlock(data.type, data.category)
  const stageConfig = getStageConfig(stageNum)
  // Bloc de transition : fond en dégradé bicolore entrée → sortie (spec §5).
  const transitionPair = TRANSITION_GRADIENT[data.type]
  const transitionStyle = transitionPair
    ? { background: `linear-gradient(135deg, ${engineColor(transitionPair[0])}33 0%, ${engineColor(transitionPair[1])}33 100%)` }
    : undefined

  // Ports fournis (état dérivé des edges — jamais stocké) : un input est
  // fourni s'il a une edge entrante, un output s'il a une edge sortante.
  const inputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.target === id).map(e => [e.targetHandle ?? 'in_1', true])),
    [flowEdges, id],
  )
  const outputFed = useMemo(
    () => Object.fromEntries(flowEdges.filter(e => e.source === id).map(e => [e.sourceHandle ?? 'out_1', true])),
    [flowEdges, id],
  )

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
      style={transitionStyle}
      className="bg-surface2 min-w-45 max-w-64 overflow-visible rounded-2xl border-t-4 p-3 shadow-sm border-border"
    >
      <div className="flex items-start justify-between gap-2 py-2.5">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span title={`${stageConfig.name} (${stageConfig.label})`} className="inline-flex">
              <Badge
                variant="outline"
                className="text-xs font-extrabold px-1.5 py-0.5 rounded shrink-0 border"
              >
                {stageConfig.key}
              </Badge>
            </span>
            <h4 className="text-sm font-extrabold text-text-light truncate m-0 leading-snug">{data.label || data.type || 'Untitled'}</h4>
          </div>
          {description && <p className="text-xs text-text-muted line-clamp-2 m-0 mt-0.5">{description}</p>}
        </div>
        <div className="justify-self-end self-start">
          <svg
            className="block-drag-handle cursor-grab"
            width={12}
            height={16}
            viewBox="0 0 12 16"
            aria-label="Déplacer le bloc"
          >
            <g className="fill-text-muted">
              <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
              <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
              <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
            </g>
          </svg>
        </div>
      </div>
      {(Array.isArray(data.inputs) && data.inputs.length > 0 || Array.isArray(data.outputs) && data.outputs.length > 0 || Array.isArray(data.segs) && data.segs.length > 0) && (
        <div className="flex flex-col min-h-0 flex-auto">
          <div className="grid grid-cols-3 items-start gap-x-3">
            {Array.isArray(data.inputs) && data.inputs.length > 0 && (
              <div className={`${inputsClassName} col-start-1 row-start-1`}>
                {data.inputs.map(p => (
                  <div key={p.name} className={inputFed[p.name] ? 'text-success' : undefined}>
                    {p.name} · {p.dtype}
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(data.outputs) && data.outputs.length > 0 && (
              <div className={`${outputsClassName} col-start-3 row-start-1`}>
                {data.outputs.map(p => (
                  <div key={p.name} className={outputFed[p.name] ? 'text-success' : undefined}>
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
                    <Separator className="col-span-full my-2" />
                  )}
                  {Array.isArray(data.segs) && data.segs.length > 0 && (
                    <BlockSegments segs={data.segs} fields={data.fields} blockId={id} blockType={data.type} onUpdate={updateFlowParam} columnOptions={columnOptions} startRow={hasBody ? (hasParams ? 3 : 1) : 1} />
                  )}
                  {(() => {
                    if (!hasBody && !hasParams) return null
                    return <Separator orientation="vertical" className="col-start-2 h-full" />
                  })()}
                </>
              )
            })()}
            <div className="col-span-3 flex justify-end pt-2">
              <button className="block-delete-btn border-none bg-transparent text-text-muted font-extrabold text-xs cursor-pointer p-0 font-body" onClick={() => removeFlowNode(id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      {data.inputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="target"
          position={Position.Left}
          className={`${inputFed[p.name] ? handleFedClassName : handleClassName} ${isAmbiguous(data.inputs) || i === 0 ? '' : 'pointer-events-none'}`}
          // Côté non-ambigu : tous les handles empilés au centre (50%), un seul visible (i === 0)
          style={{
            top: isAmbiguous(data.inputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(data.inputs) || i === 0 ? 1 : 0,
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
          className={`${outputFed[p.name] ? handleFedClassName : handleClassName} ${isAmbiguous(data.outputs) || i === 0 ? '' : 'pointer-events-none'}`}
          // Côté non-ambigu : empilé au centre, un seul visible
          style={{
            top: isAmbiguous(data.outputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(data.outputs) || i === 0 ? 1 : 0,
          }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
    </Card>
  )
}

function BlockNode(props: NodeProps<Node<BlockNodeData>>) {
  const catalog = useAppStore(s => s.catalog)
  const isCatalogSuperBlock = catalog?.superblocks.some(s => s.id === props.data.type) ?? false
  if (isCatalogSuperBlock) {
    return <SuperBlockNode {...props} />
  }
  return <StandardBlockNode {...props} />
}

export default memo(BlockNode)
