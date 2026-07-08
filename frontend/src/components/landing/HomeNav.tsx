import useAppStore from '../../store/useAppStore'

export default function HomeNav() {
  const goBuild = useAppStore(s => s.goBuild)

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#D97757', boxShadow: '0 3px 0 rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 13, height: 13, background: '#fff', borderRadius: 4 }} />
        </div>
        <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 23, letterSpacing: '-.01em' }}>MLBlock</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#b7ada3', cursor: 'pointer' }}>Découvrir</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#b7ada3', cursor: 'pointer' }}>Exemples</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#b7ada3', cursor: 'pointer' }}>Pour les profs</span>
        <button
          onClick={goBuild}
          style={{ background: '#D97757', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.25)' }}
        >
          Ouvrir l'éditeur
        </button>
      </div>
    </nav>
  )
}
