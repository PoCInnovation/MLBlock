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

        <div style={{ margin: '8px 0', overflowX: 'auto', paddingBottom: 4 }}>
          <ToggleButtonGroup
            type="single"
            label="Filtre par pattern"
            value={patternFilter}
            onChange={v => setPatternFilter((v as string) || 'all')}
            size="sm"
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                <ToggleButton key={key} label={label} value={key} />
              ))}
            </div>
          </ToggleButtonGroup>
        </div>

        {error && <Text type="body" color="secondary" style={{ color: 'var(--color-error-light)' }}>{error}</Text>}
        {!error && templates === null && <Text type="body" color="secondary">Chargement des baselines…</Text>}
        {!error && templates !== null && filtered.length === 0 && (
          <Text type="body" color="secondary">Aucun modèle trouvé pour ce filtre.</Text>
        )}

        <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {filtered.map(t => (
            <Card key={t.id} variant="muted" padding={2}>
              <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <VStack gap={1} style={{ flex: 1, minWidth: 0 }}>
                  <HStack gap={1.5} style={{ alignItems: 'center' }}>
                    <Badge label={t.code} style={{ fontWeight: 800, fontSize: 11 }} />
                    <Heading level={5} style={{ fontSize: 13.5, margin: 0 }}>{t.name}</Heading>
                  </HStack>
                  <Text type="supporting" color="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {t.description}
                  </Text>
                  <Text type="supporting" color="secondary" style={{ fontSize: 11, opacity: 0.8 }}>
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
