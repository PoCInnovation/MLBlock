import { useNavigate } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import SiteLayout from '../components/landing/SiteLayout'
import { Button, Card, VStack, HStack, Stack } from '@astryxdesign/core'
import { Heading, Text } from '@astryxdesign/core/Text'
import { Icon } from '@astryxdesign/core/Icon'
import { theme } from '../theme'

export default function HowItWorksPage() {
  const navigate = useNavigate()

  return (
    <SiteLayout>
      {/* Intro */}
      <section style={{ padding: '64px 48px 0' }}>
        <Stack style={{ maxWidth: 1240, margin: '0 auto' }}>
          <VStack gap={3}>
            <Heading level={1}>Comment ça marche</Heading>
            <Text type="body" color="secondary" style={{ maxWidth: 680 }}>MLBlock permet de construire un pipeline de machine learning en assemblant des blocs, sans écrire une ligne de code.</Text>
          </VStack>
        </Stack>
      </section>

      {/* Le principe d'assemblage */}
      <section style={{ padding: '64px 48px 0' }}>
        <Stack style={{ maxWidth: 1240, margin: '0 auto' }}>
          <VStack gap={3}>
            <Heading level={2}>Le principe d'assemblage</Heading>
            <Card variant="default" padding={4}>
              <Text type="body" color="secondary">Les blocs s'emboîtent comme des pièces de puzzle, encoches en bas, trous en haut. Tu déposes un bloc sous un autre, il se clipse. Pas de fils à tirer, pas de connexions à faire à la main. L'ordre dans lequel tu empiles tes blocs, c'est l'ordre dans lequel ils s'exécutent.</Text>
            </Card>
          </VStack>
        </Stack>
      </section>

      {/* Que se passe-t-il quand tu appuies sur Démarrer ? */}
      <section style={{ padding: '64px 48px 0' }}>
        <Stack style={{ maxWidth: 1240, margin: '0 auto' }}>
          <VStack gap={3}>
            <Heading level={2}>Que se passe-t-il quand tu appuies sur Démarrer&nbsp;?</Heading>
            <Card variant="default" padding={4}>
              <VStack gap={4} as="ol" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                  <HStack key={i} gap={3} style={{ alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: '#2e2420', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 15, color: theme.color.accent }}>
                      {i + 1}
                    </div>
                    <VStack gap={1}>
                      <Heading level={5}>{title}</Heading>
                      <Text type="body" color="secondary">{text}</Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </Card>
          </VStack>
        </Stack>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 48px' }}>
        <Stack style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Card variant="default" padding={4}>
            <HStack gap={4} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <VStack gap={1}>
                <Heading level={3}>Prêt à assembler ton premier pipeline ?</Heading>
                <Text type="body" color="secondary">Tu peux commencer maintenant.</Text>
              </VStack>
              <Button label="Ouvrir l'éditeur" variant="primary" icon={<Icon icon={Play} size="sm" />} onClick={() => navigate({ to: '/editor' })} />
            </HStack>
          </Card>
        </Stack>
      </section>
    </SiteLayout>
  )
}
