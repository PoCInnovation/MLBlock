import { useEffect, useState } from 'react'
import { http } from '../../api/client'
import { FileUp } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { Card, VStack, HStack, Button } from '@astryxdesign/core'
import { Heading, Text } from '@astryxdesign/core/Text'
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

      <VStack gap={2}>
        <Text type="label" style={{ textTransform: 'uppercase', letterSpacing: '.5px' }}>Utiliser nos données</Text>
        {error && <Text type="body" color="secondary" style={{ color: 'var(--color-error-light)' }}>{error}</Text>}
        {!error && samples === null && <Text type="body" color="secondary">Chargement…</Text>}
        {!error && samples !== null && samples.length === 0 && (
          <Text type="body" color="secondary">Aucune donnée d'exemple dans cette catégorie.</Text>
        )}
        {samples?.map(s => (
          <Card key={s.id} variant="muted" padding={2}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <VStack gap={1}>
                <Heading level={5} style={{ fontSize: 13.5 }}>{s.name}</Heading>
                <Text type="supporting" color="secondary">{s.description}</Text>
                <Text type="supporting" color="secondary">{s.columns.length > 0 ? `${s.columns.length} colonnes · ` : ''}{s.rows} ligne(s)</Text>
              </VStack>
              <Button label="Utiliser" variant="primary" size="sm" onClick={() => onPick(s.url, s.name)} />
            </HStack>
          </Card>
        ))}

        <Text type="label" style={{ textTransform: 'uppercase', letterSpacing: '.5px' }}>Apporter vos données</Text>
        <Button label="Choisir un fichier" variant="ghost" icon={<Icon icon={FileUp} size="sm" />} onClick={onChooseFile} style={{ width: '100%' } as never} />
      </VStack>
    </Dialog>
  )
}
