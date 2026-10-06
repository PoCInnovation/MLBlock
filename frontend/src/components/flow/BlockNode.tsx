import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../store/useAppStore'
import BlockCard from './BlockCard'
import { isAmbiguous } from '../../utils/portResolution'
import type { Port, Segment } from '../../types/catalog'

// Taille/bordure du handle : classes !important car le CSS ReactFlow
// (non-layé) écraserait les utilitaires Tailwind sinon.
const handleClassName = '!w-3.5 !h-3.5 !rounded-full !bg-accent !border-2 !border-surface2'
const handleFedClassName = '!w-3.5 !h-3.5 !rounded-full !bg-success !border-2 !border-surface2'

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

/**
 * Nœud canvas : la MÊME BlockCard que la liste et la sheet config, plus les
 * handles de connexion. Aucun paramètre ici — ils s'ouvrent au clic, dans
 * l'inspecteur.
 */
function BlockNode({ data, id }: NodeProps<Node<BlockNodeData>>) {
  const removeFlowNode = useAppStore(s => s.removeFlowNode)
  const { flowEdges } = useAppStore(useShallow(s => ({ flowEdges: s.flowEdges })))

  const inputs = data.inputs ?? []
  const outputs = data.outputs ?? []

  const inputFed = Object.fromEntries(
    flowEdges.filter(e => e.target === id).map(e => [e.targetHandle ?? 'in_1', true]),
  )
  const outputFed = Object.fromEntries(
    flowEdges.filter(e => e.source === id).map(e => [e.sourceHandle ?? 'out_1', true]),
  )

  return (
    <div className="relative">
      <BlockCard type={data.type} draggable onDelete={() => removeFlowNode(id)} />

      {inputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="target"
          position={Position.Left}
          className={`${inputFed[p.name] ? handleFedClassName : handleClassName} ${isAmbiguous(inputs) || i === 0 ? '' : 'pointer-events-none'}`}
          // Côté non-ambigu : tous les handles empilés au centre (50%), un seul visible
          style={{
            top: isAmbiguous(inputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(inputs) || i === 0 ? 1 : 0,
          }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
      {outputs.map((p, i, arr) => (
        <Handle
          key={p.name}
          id={p.name}
          type="source"
          position={Position.Right}
          className={`${outputFed[p.name] ? handleFedClassName : handleClassName} ${isAmbiguous(outputs) || i === 0 ? '' : 'pointer-events-none'}`}
          style={{
            top: isAmbiguous(outputs) ? topFor(i, arr.length) : '50%',
            opacity: isAmbiguous(outputs) || i === 0 ? 1 : 0,
          }}
          title={`${p.name}: ${p.dtype}`}
        />
      ))}
    </div>
  )
}

export default memo(BlockNode)