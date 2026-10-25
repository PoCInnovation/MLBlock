import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import useAppStore from '../../store/useAppStore'
import { compatibleBlocks } from '../../utils/superblocks'
import BlockCard from './BlockCard'

type Props = {
  nodeId: string
  port: string
  onPick: (type: string) => void
}

/** Sheet 'compat' : blocs consommant la sortie, compatibles puis convertibles (spec §3). */
export default function CompatSheet({ nodeId, port, onPick }: Props) {
  const catalog = useAppStore(s => s.catalog)
  const flowNodes = useAppStore(s => s.flowNodes)
  const node = flowNodes.find(n => n.id === nodeId)
  const data = node?.data as { type?: string; outputs?: { name: string; dtype: string }[] } | undefined
  const outDtype = data?.outputs?.find(o => o.name === port)?.dtype
  const lists = useMemo(() => {
    if (!catalog || !outDtype) {
      return {
        superblocks: { compatible: [], convertible: [] },
        blocks: { compatible: [], convertible: [] },
      }
    }
    return compatibleBlocks(catalog, outDtype, data?.type)
  }, [catalog, outDtype, data?.type])

  if (!outDtype) {
    return <p className="text-sm text-muted-foreground">Sortie introuvable.</p>
  }

  const totalSb = lists.superblocks.compatible.length + lists.superblocks.convertible.length
  const totalBlocks = lists.blocks.compatible.length + lists.blocks.convertible.length

  const renderGroup = (
    title: string,
    group: { compatible: string[]; convertible: string[] },
  ) => {
    const total = group.compatible.length + group.convertible.length
    if (total === 0) return null
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        {group.compatible.length > 0 && (
          <div className="flex flex-col gap-2">
            {group.compatible.slice(0, 12).map(type => (
              <BlockCard key={type} type={type} onClick={() => onPick(type)} />
            ))}
          </div>
        )}
        {group.convertible.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground pt-1">
              Via adaptateur automatique
            </span>
            {group.convertible.slice(0, 12).map(type => (
              <BlockCard key={type} type={type} onClick={() => onPick(type)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-heading font-bold text-foreground">Après « {port} »</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{outDtype}</p>
      </div>
      <Separator />
      {renderGroup('SuperBlocks', lists.superblocks)}
      {totalSb > 0 && totalBlocks > 0 && <Separator />}
      {renderGroup('Blocs', lists.blocks)}
      {totalSb === 0 && totalBlocks === 0 && (
        <p className="text-sm text-muted-foreground">Aucun bloc ni SuperBlock ne consomme ce type.</p>
      )}
    </div>
  )
}
