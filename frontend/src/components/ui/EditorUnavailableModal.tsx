import { theme } from '../../theme'
import { useNavigate } from '@tanstack/react-router'
import useAppStore from '../../store/useAppStore'
import { CloudOff, ArrowLeft } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'

export default function EditorUnavailableModal() {
  const navigate = useNavigate()
  const message = useAppStore(s => s.catalogErrorMessage)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#221c19', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '40px 48px', textAlign: 'center', maxWidth: 420, width: '90%' }}>
        <div style={{ fontSize: 36, marginBottom: 16, color: theme.color.warning }}><Icon icon={CloudOff} size="lg" /></div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 10, color: '#f0e9e3' }}>
          Éditeur non disponible
        </div>
        <div style={{ fontSize: 14, color: theme.color.textMuted, marginBottom: 28, lineHeight: 1.6 }}>
          {message ?? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'}
        </div>
        <button
          onClick={() => navigate({ to: '/' })}
          style={{ background: 'rgba(255,255,255,.08)', color: '#e8e0d8', border: '1px solid rgba(255,255,255,.15)', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          <Icon icon={ArrowLeft} size="sm" /> Retour
        </button>
      </div>
    </div>
  )
}
