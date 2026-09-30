import { Play } from 'lucide-react'
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
  { key: 0, bg: 'var(--color-accent)', color: '#fff', label: <><Play size={13} color="#fff" /> Démarrer le projet</>, isHat: true },
  { key: 1, bg: 'var(--color-accent-light)', color: '#2a211c', label: <>Charger <span className="bg-white/85 px-1.5 py-0.5 rounded-md">Photos</span></> },
  { key: 2, bg: 'var(--color-status)', color: '#2a211c', label: <>Mettre à la même échelle</> },
  { key: 3, bg: '#B6A0E3', color: '#2a211c', label: <>Réseau de <span className="bg-white/85 px-1.5 py-0.5 rounded-md">128</span> neurones</> },
  { key: 4, bg: '#7DAFEA', color: '#2a211c', label: <>Apprendre <span className="bg-white/85 px-1.5 py-0.5 rounded-md">10</span> tours</>, isLast: true },
]

// Border radii are hardcoded to match the snap-aligned result (all 5 blocks at the same width).
function blockRadius(isHat?: boolean, isLast?: boolean) {
  if (isHat)  return '14px 0px 0px 0px'
  if (isLast) return '0px 0px 12px 12px'
  return '0px 0px 0px 0px'
}

export default function HeroBlockStack() {
  return (
    <div aria-hidden="true" className="hero-float">
      <div className="relative p-6.5 bg-surface4 border border-white/[0.07] rounded-3xl shadow-2xl max-w-95 ml-auto">
        <div className="flex gap-1.5 mb-4.5">
          <span className="w-2.5 h-2.5 rounded-full bg-error" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="w-2.5 h-2.5 rounded-full bg-status" />
        </div>
        <div className="flex flex-col items-start">
          {BLOCKS.map(({ key, bg, color, label, isHat, isLast }) => (
            <div
              key={key}
              className="relative inline-flex gap-1.5 items-center font-extrabold hero-block-shadow min-w-67.5"
              style={{
                zIndex: BLOCKS.length - key,
                background: bg,
                color,
                fontSize: isHat ? 14 : 13.5,
                padding: isHat ? '11px 16px 13px' : '13px 16px 11px',
                borderRadius: blockRadius(isHat, isLast),
              }}
            >
              {!isHat && <div className="absolute top-0 left-5 w-6 h-2.5 bg-surface4 rounded-b-full" />}
              {label}
              <div className="absolute -bottom-2.75 left-5 w-6 h-2.5 rounded-b-full" style={{ background: bg }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
