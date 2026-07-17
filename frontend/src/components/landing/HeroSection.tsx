import useAppStore from '../../store/useAppStore'
import HeroBlockStack from './HeroBlockStack'

export default function HeroSection() {
  const goBuild = useAppStore(s => s.goBuild)

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="landing-hero" style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 48px 90px', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 56, alignItems: 'center' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,87,.14)', border: '1px solid rgba(217,119,87,.35)', color: '#E8915F', padding: '7px 14px', borderRadius: 999, fontWeight: 800, fontSize: 13, letterSpacing: '.02em' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8915F' }} />
          Sans code, pour apprendre l'IA
        </div>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 62, lineHeight: 1.04, letterSpacing: '-.02em', margin: '22px 0 0', textWrap: 'balance' }}>
          Crée ton intelligence<br />artificielle, <span style={{ color: '#D97757' }}>bloc par bloc.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: '#b7ada3', maxWidth: 470, margin: '22px 0 0', fontWeight: 600 }}>
          Empile des blocs pour construire un modèle qui apprend tout seul : reconnaître des images, comprendre des phrases, prédire des évènements. Pas besoin de savoir programmer, il suffit d'assembler.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
          <button
            onClick={goBuild}
            style={{ background: '#D97757', color: '#fff', border: 'none', padding: '15px 26px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.25)', display: 'inline-flex', alignItems: 'center', gap: 9 }}
          >
            <span style={{ fontSize: 13 }}>▶</span> Commencer à construire
          </button>
          <button
            onClick={scrollToFeatures}
            style={{ background: 'rgba(255,255,255,.06)', color: '#f0e9e3', border: '1px solid rgba(255,255,255,.14)', padding: '15px 24px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
          >
            En savoir plus
          </button>
        </div>
      </div>
      <div className="landing-hero-visual">
        <HeroBlockStack />
      </div>
    </section>
  )
}
