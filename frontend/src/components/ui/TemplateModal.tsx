import { useEffect, useState } from 'react'
import { listExos } from '../../api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ExoTemplate } from '../../types/catalog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'

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
    <Dialog open={isOpen} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent
        className="w-full p-6 bg-card border-border flex flex-col"
        style={{ maxWidth: 740, height: 620, maxHeight: '85vh' }}
      >
        <DialogHeader className="gap-1 pb-1 shrink-0">
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Baselines & Modèles Prêts à l'Emploi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Charge un pipeline complet (données → traitement → modèle → évaluation/visualisation) prêt à être exécuté ou modifié dans le canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="overflow-x-auto pb-1 shrink-0">
            <ToggleGroup
              type="single"
              value={patternFilter}
              onValueChange={v => { if (v) setPatternFilter(v) }}
              size="sm"
              className="flex gap-1.5 justify-start flex-wrap"
            >
              {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                <ToggleGroupItem key={key} value={key} aria-label={label} className="text-xs px-3 py-1">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {error && <p className="text-sm text-destructive font-semibold shrink-0">{error}</p>}
          {!error && templates === null && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Chargement des baselines…
            </div>
          )}
          {!error && templates !== null && filtered.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Aucun modèle trouvé pour ce filtre.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-1.5">
              {filtered.map(t => (
                <Card key={t.id} className="bg-muted/40 hover:bg-muted/70 border border-border transition-colors shrink-0">
                  <CardContent className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline" className="font-extrabold text-xs px-2 py-0.5 border-primary/40 text-primary bg-primary/10">
                          {t.code}
                        </Badge>
                        <h3 className="font-heading text-sm font-semibold m-0 text-foreground">{t.name}</h3>
                      </div>
                      <p className="text-xs leading-normal text-muted-foreground">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span>{t.nodes.length} blocs</span>
                        <span>·</span>
                        <span>{t.edges.length} connexions</span>
                        <span>·</span>
                        <span className="capitalize">{t.pattern}</span>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="shrink-0 font-bold px-4 self-end sm:self-center"
                      onClick={() => {
                        onSelect(t)
                        onClose()
                      }}
                    >
                      Charger
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
