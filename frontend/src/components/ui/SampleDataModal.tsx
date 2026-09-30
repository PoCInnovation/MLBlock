import { useEffect, useState } from 'react'
import { http } from '../../api/client'
import { FileUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Sample } from '../../utils/samples'
import { Dialog, DialogTitle } from './dialog'

export type SampleDataModalProps = {
  category: string
  onPick: (url: string, name: string) => void
  onChooseFile: () => void
  onClose: () => void
}

/** Modal « Données d'entraînement » : nos données (samples) ou les vôtres. */
export default function SampleDataModal({ category, onPick, onChooseFile, onClose }: SampleDataModalProps) {
  const [open] = useState(true)
  const [samples, setSamples] = useState<Sample[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset synchrone volontaire : changement de catégorie → état « Chargement… » immédiat, pas de liste périmée.
    setSamples(null)
    setError(null)
    http
      .get<Sample[]>('/api/samples', { params: { category } })
      .then(r => { if (!cancelled) setSamples(r.data) })
      .catch(() => { if (!cancelled) setError('Bibliothèque de données indisponible pour le moment.') })
    return () => { cancelled = true }
  }, [category])

  return (
    <Dialog isOpen={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogTitle>Données d'entraînement</DialogTitle>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utiliser nos données</label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && samples === null && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!error && samples !== null && samples.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune donnée d'exemple dans cette catégorie.</p>
        )}
        {samples?.map(s => (
          <Card key={s.id} className="bg-muted/50 border-border/50">
            <CardContent className="p-3 flex justify-between items-center gap-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground m-0">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <p className="text-xs text-muted-foreground opacity-80">{s.columns.length > 0 ? `${s.columns.length} colonnes · ` : ''}{s.rows} ligne(s)</p>
              </div>
              <Button variant="default" size="sm" onClick={() => onPick(s.url, s.name)}>
                Utiliser
              </Button>
            </CardContent>
          </Card>
        ))}

        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Apporter vos données</label>
        <Button variant="ghost" size="sm" onClick={onChooseFile} className="w-full justify-center gap-2">
          <FileUp className="size-4" />
          Choisir un fichier
        </Button>
      </div>
    </Dialog>
  )
}
