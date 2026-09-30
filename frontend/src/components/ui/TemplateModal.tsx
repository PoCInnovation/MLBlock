import { useEffect, useState } from 'react'
import { listExos } from '../../api/client'
import { Card, VStack, HStack, Button, Badge, ToggleButtonGroup, ToggleButton } from '@astryxdesign/core'
import { Heading, Text } from '@astryxdesign/core/Text'
import type { ExoTemplate } from '../../types/catalog'
import { Dialog, DialogTitle } from './dialog'

export type TemplateModalProps = {
  isOpen: boolean
  onSelect: (template: ExoTemplate) => void
  onClose: () => void
}

const PATTERN_LABELS: Record<string, string> = {
  all: 'Tous',
  clustering: 'Clustering',
  cnn: 'CNN',
  classification: 'Classification',
  'deep-learning': 'Deep Learning',
  nlp: 'NLP',
  timeseries: 'Séries',
  rl: 'RL',
}

export default function TemplateModal({ isOpen, onSelect, onClose }: TemplateModalProps) {
  const [templates, setTemplates] = useState<ExoTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [patternFilter, setPatternFilter] = useState<string>('all')

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    listExos()
      .then(items => {
        if (!cancelled) setTemplates(items)
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger les modèles de pipeline pour le moment.')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const filtered = (templates ?? []).filter(t => {
    if (patternFilter === 'all') return true
    return t.pattern === patternFilter
  })

  return (
    <Dialog isOpen={isOpen} onOpenChange={o => { if (!o) onClose() }}>
      <DialogTitle>Baselines & Modèles Prêts à l'Emploi</DialogTitle>

      <VStack gap={2}>
        <Text type="body" color="secondary">
          Charge un pipeline complet (données → traitement → modèle → évaluation/visualisation) prêt à être exécuté ou modifié dans le canvas.
        </Text>

        <div className="my-2 overflow-x-auto pb-1">
          <ToggleButtonGroup
            type="single"
            label="Filtre par pattern"
            value={patternFilter}
            onChange={v => setPatternFilter((v as string) || 'all')}
            size="sm"
          >
            <div className="flex gap-1.5">
              {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                <ToggleButton key={key} label={label} value={key} />
              ))}
            </div>
          </ToggleButtonGroup>
        </div>
        {error && <Text type="body" color="secondary" className="text-error-light">{error}</Text>}
        {!error && templates === null && <Text type="body" color="secondary">Chargement des baselines…</Text>}
        {!error && templates !== null && filtered.length === 0 && (
          <Text type="body" color="secondary">Aucun modèle trouvé pour ce filtre.</Text>
        )}

        <div className="max-h-96 overflow-y-auto flex flex-col gap-2 pr-1">
          {filtered.map(t => (
            <Card key={t.id} variant="muted" padding={2}>
              <HStack gap={2} className="justify-between items-center">
                <VStack gap={1} className="flex-1 min-w-0">
                  <HStack gap={1.5} className="items-center">
                    <Badge label={t.code} className="font-extrabold text-xs" />
                    <Heading level={5} className="text-sm m-0">{t.name}</Heading>
                  </HStack>
                  <Text type="supporting" color="secondary" className="text-xs leading-normal">
                    {t.description}
                  </Text>
                  <Text type="supporting" color="secondary" className="text-xs opacity-80">
                    {t.nodes.length} blocs · {t.edges.length} connexions · {t.pattern}
                  </Text>
                </VStack>
                <Button
                  label="Charger"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onSelect(t)
                    onClose()
                  }}
                />
              </HStack>
            </Card>
          ))}
        </div>
      </VStack>
    </Dialog>
  )
}
