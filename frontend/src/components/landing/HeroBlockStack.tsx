import React from 'react'

type HeroBlock = {
  key: number
  bg: string
  color: string
  label: React.ReactNode
  isHat?: boolean
  isLast?: boolean
}

const BLOCKS: HeroBlock[] = [
  { key: 0, bg: '#D97757', color: '#fff',     label: <>▶ Démarrer le projet</>, isHat: true },
  { key: 1, bg: '#E59060', color: '#2a211c',  label: <>Charger <span style={{ background: 'rgba(255,255,255,.85)', padding: '2px 7px', borderRadius: 6 }}>Photos</span></> },
  { key: 2, bg: '#66C7B0', color: '#2a211c',  label: <>Mettre à la même échelle</> },
  { key: 3, bg: '#B6A0E3', color: '#2a211c',  label: <>Réseau de <span style={{ background: 'rgba(255,255,255,.85)', padding: '2px 7px', borderRadius: 6 }}>128</span> neurones</> },
  { key: 4, bg: '#7DAFEA', color: '#2a211c',  label: <>Apprendre <span style={{ background: 'rgba(255,255,255,.85)', padding: '2px 7px', borderRadius: 6 }}>10</span> tours</>, isLast: true },
]

// Border radii are hardcoded to match the snap-aligned result (all 5 blocks at the same width).
function blockRadius(isHat?: boolean, isLast?: boolean) {
  if (isHat)  return '14px 0px 0px 0px'
  if (isLast) return '0px 0px 12px 12px'
  return '0px 0px 0px 0px'
}

export default function HeroBlockStack() {
  return (
    <div style={{ animation: 'mlbFloat 5s ease-in-out infinite' }}>
      <div style={{ position: 'relative', padding: 26, background: '#211b18', border: '1px solid rgba(255,255,255,.07)', borderRadius: 24, boxShadow: '0 30px 60px rgba(0,0,0,.4)', maxWidth: 380, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E0705F' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E6C766' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#66C7B0' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {BLOCKS.map(({ key, bg, color, label, isHat, isLast }) => (
            <div
              key={key}
              style={{
                position: 'relative',
                zIndex: BLOCKS.length - key,
                background: bg,
                color,
                fontWeight: 800,
                fontSize: isHat ? 14 : 13.5,
                padding: isHat ? '11px 16px 13px' : '13px 16px 11px',
                borderRadius: blockRadius(isHat, isLast),
                boxShadow: '0 2px 0 rgba(0,0,0,.18)',
                display: 'inline-flex',
                gap: 7,
                alignItems: 'center',
                minWidth: 270,
              }}
            >
              {!isHat && <div style={{ position: 'absolute', top: 0, left: 20, width: 24, height: 11, background: '#211b18', borderRadius: '0 0 999px 999px' }} />}
              {label}
              <div style={{ position: 'absolute', bottom: -11, left: 20, width: 24, height: 11, background: bg, borderRadius: '0 0 999px 999px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
