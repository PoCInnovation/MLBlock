import { useNavigate } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import SiteLayout from '../components/landing/SiteLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
export default function HowItWorksPage() {
  const navigate = useNavigate()

  return (
    <SiteLayout>
      {/* Intro */}
      <section className="px-12 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">Comment ça marche</h1>
            <p className="text-secondary max-w-2xl text-base">MLBlock permet de construire un pipeline de machine learning en assemblant des blocs, sans écrire une ligne de code.</p>
          </div>
        </div>
      </section>

      {/* Le principe d'assemblage */}
      <section className="px-12 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">Le principe d'assemblage</h2>
            <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm">
              <p className="text-secondary text-base">Les blocs s'emboîtent comme des pièces de puzzle, encoches en bas, trous en haut. Tu déposes un bloc sous un autre, il se clipse. Pas de fils à tirer, pas de connexions à faire à la main. L'ordre dans lequel tu empiles tes blocs, c'est l'ordre dans lequel ils s'exécutent.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Que se passe-t-il quand tu appuies sur Démarrer ? */}
      <section className="px-12 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">Que se passe-t-il quand tu appuies sur Démarrer&nbsp;?</h2>
            <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm">
              <ol className="list-none m-0 p-0 flex flex-col gap-4">
                {[
                  {
                    title: 'Tu assembles, on construit la structure',
                    text: 'Chaque pipeline que tu construis avec tes blocs est traduit en graphe de nœuds, une structure envoyée à notre serveur dès que tu cliques sur "Démarrer".',
                  },
                  {
                    title: 'Une machine créée juste pour toi',
                    text: 'Notre serveur commande alors une machine temporaire chez Amazon (AWS), dédiée entièrement à l\'exécution de ton pipeline le temps de l\'entraînement.',
                  },
                  {
                    title: 'Un suivi en direct',
                    text: 'Pendant l\'entraînement, cette machine envoie régulièrement des nouvelles à notre serveur, qui te les transmet en direct dans l\'éditeur.',
                  },
                  {
                    title: 'Une coupure, ce n\'est pas grave',
                    text: 'Ces machines cloud sont temporaires et peuvent parfois être interrompues par Amazon. Dans ce cas, l\'exécution est transférée sur une nouvelle machine pour continuer le travail sans tout perdre.',
                  },
                  {
                    title: 'Le résultat arrive chez toi',
                    text: 'Une fois l\'entraînement terminé, le résultat final remonte de la machine vers notre serveur, qui te l\'affiche directement dans l\'éditeur.',
                  },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-surface2 border border-white/10 flex items-center justify-center font-heading font-bold text-base text-accent">
                      {i + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h5 className="font-heading font-bold text-base text-foreground">{title}</h5>
                      <p className="text-secondary text-sm sm:text-base">{text}</p>
                    </div>
                  </div>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm">
            <div className="flex gap-4 justify-between flex-wrap items-center">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-xl font-bold text-foreground">Prêt à assembler ton premier pipeline ?</h3>
                <p className="text-secondary text-sm">Tu peux commencer maintenant.</p>
              </div>
              <Button onClick={() => navigate({ to: '/editor' })} className="gap-2">
                <Play className="size-4" />
                Ouvrir l'éditeur
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </SiteLayout>
  )
}
