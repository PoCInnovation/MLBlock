import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronRight } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { compatibleBlocks } from '../../utils/superblocks'

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

  const labelOf = (type: string) =>
    catalog?.blocks[type]?.segs.find(s => s.t === 'text')?.v ?? type

  if (!outDtype) {
    return <p className="text-sm text-muted-foreground">Sortie introuvable.</p>
  }

  const section = (title: string, items: string[], convertible: boolean) => (
    items.length > 0 ? (
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-heading font-bold text-foreground">{title}</h3>
        {items.slice(0, 12).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            className="flex items-center gap-2 w-full text-left p-2.5 rounded-xl bg-card border border-border hover:border-accent transition-colors cursor-pointer min-h-11"
          >
            <span className="text-xs font-bold text-foreground flex-1 truncate">{labelOf(type)}</span>
            {convertible && (
              <Badge variant="outline" className="text-[10px] shrink-0">adaptateur</Badge>
            )}
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </button>
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
