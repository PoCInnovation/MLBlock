import { useNavigate } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import HeroBlockStack from './HeroBlockStack'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  const navigate = useNavigate()

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="landing-hero max-w-310 mx-auto px-12 pt-12 pb-22.5 grid hero-grid-cols gap-14 items-center">
      <div>
        <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/35 text-accent-light px-3.5 py-1.5 rounded-full font-extrabold text-sm tracking-wide">
          <span className="w-2 h-2 rounded-full bg-accent-light" />
          Sans code, pour apprendre l'IA
        </div>
        <h1 className="font-heading font-semibold text-6xl leading-tight tracking-tight mt-5 text-balance">
          Crée ton intelligence<br />artificielle, <span className="text-accent">bloc par bloc.</span>
        </h1>
        <p className="text-lg leading-relaxed text-text-muted max-w-117.5 mt-5 font-semibold">
          Empile des blocs pour construire un modèle qui apprend tout seul : reconnaître des images, comprendre des phrases, prédire des évènements. Pas besoin de savoir programmer, il suffit d'assembler.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-9">
          <Button variant="default" onClick={() => navigate({ to: '/projets' })}>
            <Play className="size-4" fill="currentColor" />
            Mes projets
          </Button>
          <Button variant="secondary" onClick={() => navigate({ to: '/cours' })}>
            Voir les cours
          </Button>
          <Button variant="secondary" onClick={scrollToFeatures}>
            En savoir plus
          </Button>
        </div>
      </div>
      <div className="landing-hero-visual">
        <HeroBlockStack />
      </div>
    </section>
  )
}
