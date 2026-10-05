import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import useAppStore from '../../store/useAppStore'
import type { SuperBlockEntry } from '../../types/catalog'
import { segsToFields } from '../../utils/flowConversion'
import { availableChildren } from '../../utils/superblocks'
import BlockSegments from '../blocks/BlockSegments'

type Props = {
  sb: SuperBlockEntry
  onAdd: (children: string[], fields: Record<string, string>) => void
}

/** Sheet 'config' : sous-options + params avant ajout au canvas (spec §3). */
export default function SuperBlockConfigSheet({ sb, onAdd }: Props) {
  const catalog = useAppStore(s => s.catalog)
  const def = catalog?.blocks[sb.id]
  const available = catalog ? availableChildren(sb, catalog) : []
  const [selected, setSelected] = useState<string[]>(available)
  const [fields, setFields] = useState<Record<string, string>>(() =>
    def ? segsToFields({ ...def, segs: def.segs }) : {},
  )

  const toggle = (type: string) =>
    setSelected(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]))

  const labelOf = (type: string) =>
    catalog?.blocks[type]?.segs.find(s => s.t === 'text')?.v ?? type

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-heading font-bold text-foreground">{sb.title}</h2>
        {def?.description && (
          <p className="text-sm text-muted-foreground mt-1">{def.description}</p>
        )}
      </div>
      <Separator />
      {sb.children.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-heading font-bold text-foreground">
            Sous-blocs ({selected.length}/{available.length})
          </h3>
          {sb.children.map(type => {
            const on = selected.includes(type)
            const missing = !catalog?.blocks[type]
            return (
              <label
                key={type}
                className={`flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card cursor-pointer min-h-11 ${on ? '' : 'opacity-55'}`}
              >
                <Checkbox
                  checked={on}
                  disabled={missing}
                  onCheckedChange={() => toggle(type)}
                  aria-label={labelOf(type)}
                />
                <span className="text-sm font-bold text-foreground flex-1">{labelOf(type)}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {missing ? 'indisponible' : on ? 'inclus' : 'exclu'}
                </Badge>
              </label>
            )
          })}
        </div>
      )}
      {def && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-heading font-bold text-foreground">Paramètres</h3>
          <div className="grid grid-cols-3 items-start gap-x-3">
            <BlockSegments
              segs={def.segs}
              fields={fields}
              blockId={sb.id}
              blockType={sb.id}
              onUpdate={(_id, k, v) => setFields(prev => ({ ...prev, [k]: v }))}
            />
          </div>
        </div>
      )}
      <Button
        size="lg"
        className="w-full font-bold"
        onClick={() => onAdd(selected, fields)}
      >
        Ajouter au canvas
      </Button>
    </div>
  )
}
