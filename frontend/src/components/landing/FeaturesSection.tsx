import React from 'react'

type Feature = { color: string; icon: React.ReactNode; title: string; desc: string }

const FEATURES: Feature[] = [
  {
    color: '#E59060',
    icon: <div style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(255,255,255,.85)' }} />,
    title: 'Comme un jeu de construction',
    desc: "Attrape un bloc, dépose-le dans ton projet. Il s'emboîte tout seul à la bonne place. Aucune ligne à taper.",
  },
  {
    color: '#B6A0E3',
    icon: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ width: 18, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.85)' }} />
        <div style={{ width: 18, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.85)' }} />
        <div style={{ width: 11, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.85)' }} />
      </div>
    ),
    title: 'Toutes les IA',
    desc: 'Images, textes, tableaux de chiffres : reconnais, classe et prédis avec des modèles simples ou de vrais réseaux de neurones.',
  },
  {
    color: '#7DAFEA',
    icon: <span style={{ color: '#fff', fontSize: 12 }}>▶</span>,
    title: 'Vois-le apprendre',
    desc: "Appuie sur Lancer et regarde, tour après tour, ton modèle se tromper de moins en moins et devenir de plus en plus précis.",
  },
]

export default function FeaturesSection() {
  return (
    <section style={{ background: '#1f1916', borderTop: '1px solid rgba(255,255,255,.05)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 48px' }}>
        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 34, letterSpacing: '-.01em', margin: '0 0 8px' }}>
          L'intelligence artificielle, en pièces à assembler
        </h2>
        <p style={{ color: '#b7ada3', fontSize: 17, fontWeight: 600, margin: '0 0 44px' }}>
          Chaque étape pour faire apprendre une machine devient un bloc coloré.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {FEATURES.map(({ color, icon, title, desc }) => (
            <div key={title} style={{ background: '#251e1a', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 28 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: color, boxShadow: '0 3px 0 rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {icon}
              </div>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 21, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ color: '#aba29a', fontSize: 15, lineHeight: 1.55, fontWeight: 600, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
