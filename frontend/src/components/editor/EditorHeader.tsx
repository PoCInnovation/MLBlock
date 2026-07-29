import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { theme } from '../../theme'

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: '1px solid rgba(255,255,255,.1)', padding: '8px 14px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }
const actionBtn: React.CSSProperties = { ...ghostBtn, color: '#cfc6bd', padding: '9px 14px' }

type EditorHeaderProps = {
  onRun: () => void
  onStop: () => void
  onClear: () => void
}

export default function EditorHeader({ onRun, onStop, onClear }: EditorHeaderProps) {
  const goHome      = useAppStore(s => s.goHome)
  const projectName = useAppStore(s => 'mon-premier-modèle')
  const running     = useAppStore(s => s.running)
  const setUser     = useAppStore(s => s.setUser)

  return (
    <div style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: theme.color.surface, borderBottom: '1px solid rgba(255,255,255,.07)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.btn }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '6px 12px', borderRadius: theme.radius.md }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#66C7B0', display: 'inline-block' }} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>{projectName}</span>
        </div>
        <button style={ghostBtn}><span style={{ opacity: .7 }}>↧</span> Importer</button>
        <button style={ghostBtn}><span style={{ opacity: .7 }}>↥</span> Exporter</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button onClick={async () => { await signOut(); setUser(null); goHome() }} style={ghostBtn}>Déconnexion</button>
        <button onClick={onClear} style={actionBtn}>Tout effacer</button>
        <button style={{ ...actionBtn, display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ fontSize: 11 }}>⏭</span> Pas à pas</button>
        <button onClick={onStop} style={{ ...actionBtn, background: 'rgba(224,112,95,.16)', color: theme.color.accentLight, border: '1px solid rgba(224,112,95,.4)', fontWeight: 800 }}>
          <span style={{ fontSize: 10 }}>■</span> Arrêter
        </button>
        <button onClick={onRun} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.accent, opacity: running ? 0.6 : 1 }}>
          <span style={{ fontSize: 11 }}>▶</span> Lancer
        </button>
      </div>
    </div>
  )
}
