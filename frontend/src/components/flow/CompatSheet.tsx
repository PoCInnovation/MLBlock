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
    if (!catalog || !outDtype) return { compatible: [], convertible: [] }
    return compatibleBlocks(catalog, outDtype, data?.type)
  }, [catalog, outDtype, data?.type])

  if (!outDtype) {
    return <p className="text-sm text-muted-foreground">Sortie introuvable.</p>
  }

  const section = (title: string, items: string[], convertible: boolean) => (
    items.length > 0 ? (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-heading font-bold text-foreground">
          {title}
          {convertible && <span className="text-xs font-semibold text-muted-foreground"> · adaptateur automatique</span>}
        </h3>
        {items.slice(0, 12).map(type => (
          <BlockCard key={type} type={type} onClick={() => onPick(type)} />
        ))}
      </div>
    ) : null
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-heading font-bold text-foreground">Après « {port} »</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{outDtype}</p>
      </div>
      <Separator />
      {section('Compatibles', lists.compatible, false)}
      {section('Via un adaptateur', lists.convertible, true)}
      {lists.compatible.length === 0 && lists.convertible.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun bloc ne consomme ce type.</p>
      )}
    </div>
  )
}
