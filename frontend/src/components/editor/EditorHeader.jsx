import useAppStore from '../../store/useAppStore'

const ACCENT = '#D97757'

const ghostBtn = { background: 'rgba(255,255,255,.06)', color: '#e8e0d8', border: '1px solid rgba(255,255,255,.1)', padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }
const actionBtn = { ...ghostBtn, color: '#cfc6bd', padding: '9px 14px' }

export default function EditorHeader({ onRun, onStop, onClear }) {
  const goHome      = useAppStore(s => s.goHome)
  const projectName = useAppStore(s => 'mon-premier-modèle')
  const running     = useAppStore(s => s.running)

  return (
    <div style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#1f1916', borderBottom: '1px solid rgba(255,255,255,.07)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 0 rgba(0,0,0,.25)' }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '6px 12px', borderRadius: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#66C7B0', display: 'inline-block' }} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>{projectName}</span>
        </div>
        <button style={ghostBtn}><span style={{ opacity: .7 }}>↧</span> Importer</button>
        <button style={ghostBtn}><span style={{ opacity: .7 }}>↥</span> Exporter</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button onClick={onClear} style={actionBtn}>Tout effacer</button>
        <button style={{ ...actionBtn, display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ fontSize: 11 }}>⏭</span> Pas à pas</button>
        <button onClick={onStop} style={{ ...actionBtn, background: 'rgba(224,112,95,.16)', color: '#E8917F', border: '1px solid rgba(224,112,95,.4)', fontWeight: 800 }}>
          <span style={{ fontSize: 10 }}>■</span> Arrêter
        </button>
        <button onClick={onRun} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.25)', display: 'inline-flex', alignItems: 'center', gap: 8, background: ACCENT, opacity: running ? 0.6 : 1 }}>
          <span style={{ fontSize: 11 }}>▶</span> Lancer
        </button>
      </div>
    </div>
  )
}
