import { Button } from '@/components/ui/button'
import useAppStore from '../../store/useAppStore'
import type { SuperBlockEntry } from '../../types/catalog'
import { availableChildren } from '../../utils/superblocks'
import BlockCard from './BlockCard'

type Props = {
  sb: SuperBlockEntry
  onAdd: (children: string[]) => void
}

/**
 * Sheet 'config' : la MÊME carte que la liste du bas (BlockCard), puis le
 * bouton d'ajout. Aucun paramètre ici — visible seulement au clic sur le bloc
 * posé. Les sous-blocs par défaut viennent du catalogue.
 */
export default function SuperBlockConfigSheet({ sb, onAdd }: Props) {
  const catalog = useAppStore(s => s.catalog)
  const available = catalog ? availableChildren(sb, catalog) : []

  return (
    <div className="flex flex-col gap-4">
      <BlockCard type={sb.id} />
      <Button size="lg" className="w-full font-bold" onClick={() => onAdd(available)}>
        Ajouter au canvas
      </Button>
    </div>
  )
}