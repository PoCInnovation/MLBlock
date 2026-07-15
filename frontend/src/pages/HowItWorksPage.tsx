import SiteLayout from '../components/landing/SiteLayout'
import useAppStore from '../store/useAppStore'

export default function HowItWorksPage() {
  const goBuild = useAppStore(s => s.goBuild)

  return (
    <SiteLayout>
      {/* Intro */}
      <section style={{ padding: '64px 48px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 46, letterSpacing: '-.02em', margin: '0 0 18px' }}>
            Comment ça marche
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#b7ada3', maxWidth: 680, margin: 0, fontWeight: 600 }}>
            MLBlock permet de construire un pipeline de machine learning en assemblant des blocs, sans écrire une ligne de code.
          </p>
        </div>
      </section>

      {/* Le principe d'assemblage */}
      <section style={{ padding: '64px 48px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 34, letterSpacing: '-.01em', margin: '0 0 18px' }}>
            Le principe d'assemblage
          </h2>
          <div style={{ background: '#1f1916', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: '32px 36px' }}>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#b7ada3', fontWeight: 600, margin: 0 }}>
              Les blocs s'emboîtent comme des pièces de puzzle, encoches en bas, trous en haut. Tu déposes un bloc sous un autre, il se clipse. Pas de fils à tirer, pas de connexions à faire à la main. L'ordre dans lequel tu empiles tes blocs, c'est l'ordre dans lequel ils s'exécutent.
            </p>
          </div>
        </div>
      </section>

      {/* Que se passe-t-il quand tu appuies sur Démarrer ? */}
      <section style={{ padding: '64px 48px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 34, letterSpacing: '-.01em', margin: '0 0 18px' }}>
            Que se passe-t-il quand tu appuies sur Démarrer&nbsp;?
          </h2>
          <div style={{ background: '#1f1916', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: '32px 36px' }}>
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
              <div key={i} style={{ display: 'flex', gap: 20, marginBottom: i < 4 ? 28 : 0 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: '#2e2420', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 15, color: '#D97757' }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 18, color: '#f0e9e3', margin: '0 0 4px' }}>{title}</p>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#b7ada3', fontWeight: 600, margin: 0 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 48px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ background: '#1f1916', border: '1px solid rgba(255,255,255,.06)', borderRadius: 24, padding: '48px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 28, margin: '0 0 8px' }}>
                Prêt à assembler ton premier pipeline ?
              </h3>
              <p style={{ color: '#b7ada3', fontSize: 16, fontWeight: 600, margin: 0 }}>
                Tu peux commencer maintenant.
              </p>
            </div>
            <button
              onClick={goBuild}
              style={{ background: '#D97757', color: '#fff', border: 'none', padding: '15px 28px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.25)', display: 'inline-flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 13 }}>▶</span> Ouvrir l'éditeur
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
