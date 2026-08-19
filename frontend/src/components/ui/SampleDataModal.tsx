import { useEffect, useState } from 'react'
import { http } from '../../api/client'
import { theme } from '../../theme'
import { FileUp } from 'lucide-react'
import type { Sample } from '../../utils/samples'
import { Dialog, DialogTitle } from './dialog'

const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, color: theme.color.textLight,
  margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '.5px',
}
const sampleCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  padding: '10px 14px', marginBottom: 8, borderRadius: theme.radius.md,
  background: 'rgba(255,255,255,.05)', border: `1px solid ${theme.color.border}`,
  color: theme.color.text,
}
const sampleMeta: React.CSSProperties = { fontSize: 11.5, color: theme.color.textMuted, fontWeight: 600, marginTop: 2 }
const useBtn: React.CSSProperties = {
  background: theme.color.accent, border: 'none', color: '#fff', borderRadius: theme.radius.sm,
  padding: '6px 12px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
}
const uploadBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
  padding: '13px 16px', borderRadius: theme.radius.md, cursor: 'pointer',
  background: 'rgba(34,197,94,.12)', border: `1px dashed rgba(34,197,94,.5)`,
  color: '#8fd1a8', fontWeight: 800, fontSize: 14,
}

export type SampleDataModalProps = {
  category: string
  onPick: (url: string, name: string) => void
  onChooseFile: () => void
  onClose: () => void
}

/** Modal « Données d'entraînement » : nos données (samples) ou les vôtres. */
export default function SampleDataModal({ category, onPick, onChooseFile, onClose }: SampleDataModalProps) {
  const [open, setOpen] = useState(true)
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogTitle>Données d'entraînement</DialogTitle>

      <div style={sectionTitle}>Utiliser nos données</div>
      {error && <div style={{ color: theme.color.errorLight, fontSize: 13, fontWeight: 700 }}>{error}</div>}
      {!error && samples === null && <div style={{ color: theme.color.textMuted, fontSize: 13 }}>Chargement…</div>}
      {!error && samples !== null && samples.length === 0 && (
        <div style={{ color: theme.color.textMuted, fontSize: 13 }}>Aucune donnée d'exemple dans cette catégorie.</div>
      )}
      {samples?.map(s => (
        <div key={s.id} style={sampleCard}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>{s.name}</div>
            <div style={sampleMeta}>{s.description}</div>
            <div style={sampleMeta}>{s.columns.length > 0 ? `${s.columns.length} colonnes · ` : ''}{s.rows} ligne(s)</div>
          </div>
          <button style={useBtn} onClick={() => onPick(s.url, s.name)}>Utiliser</button>
        </div>
      ))}

      <div style={sectionTitle}>Apporter vos données</div>
      <button style={uploadBtn} onClick={onChooseFile}><FileUp size={15} /> Choisir un fichier</button>
    </Dialog>
  )
}
