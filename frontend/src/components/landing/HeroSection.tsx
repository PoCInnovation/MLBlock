import { useNavigate } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import HeroBlockStack from './HeroBlockStack'
import { theme } from '../../theme'
import { Button, HStack } from '@astryxdesign/core'

export default function HeroSection() {
  const navigate = useNavigate()

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="landing-hero" style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 48px 90px', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 56, alignItems: 'center' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,87,.14)', border: '1px solid rgba(217,119,87,.35)', color: 'var(--color-accent-light)', padding: '7px 14px', borderRadius: 999, fontWeight: 800, fontSize: 13, letterSpacing: '.02em' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent-light)' }} />
          Sans code, pour apprendre l'IA
        </div>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 62, lineHeight: 1.04, letterSpacing: '-.02em', margin: '22px 0 0', textWrap: 'balance' }}>
          Crée ton intelligence<br />artificielle, <span style={{ color: theme.color.accent }}>bloc par bloc.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-text-muted)', maxWidth: 470, margin: '22px 0 0', fontWeight: 600 }}>
          Empile des blocs pour construire un modèle qui apprend tout seul : reconnaître des images, comprendre des phrases, prédire des évènements. Pas besoin de savoir programmer, il suffit d'assembler.
        </p>
        <HStack gap={3} style={{ marginTop: 34 }}>
          <Button label="Mes projets" variant="primary" icon={<Play size={16} fill="currentColor" />} onClick={() => navigate({ to: '/projets' })} />
          <Button label="En savoir plus" variant="secondary" onClick={scrollToFeatures} />
        </HStack>
      </div>
      <div className="landing-hero-visual">
        <HeroBlockStack />
      </div>
    </section>
  )
}
