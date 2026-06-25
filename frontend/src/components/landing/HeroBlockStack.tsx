import React, { useLayoutEffect } from 'react'

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

export default function HeroBlockStack() {
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      const els = [...document.querySelectorAll<HTMLElement>('[data-hero-block]')]
      if (!els.length) return
      const TOL = 30, R = 12
      const widths = els.map(el => el.offsetWidth)
      const sorted = [...new Set(widths)].sort((a, b) => a - b)
      const clusters: { min: number; max: number }[] = []
      sorted.forEach(w => {
        const last = clusters[clusters.length - 1]
        if (last && w - last.min <= TOL) last.max = w
        else clusters.push({ min: w, max: w })
      })
      const snap = (w: number) => { const c = clusters.find(cl => w >= cl.min && w <= cl.max); return c ? c.max : w }
      const bands = widths.map(snap)
      els.forEach((el, i) => {
        const isHat = i === 0, isLast = i === els.length - 1
        const bAbove = i === 0 ? null : bands[i - 1]
        const bBelow = isLast ? null : bands[i + 1]
        const sameAbove = bAbove != null && bands[i] === bAbove
        const sameBelow = bBelow != null && bands[i] === bBelow
        el.style.minWidth = bands[i] + 'px'
        if (isHat) {
          const br = bands[0] === bands[1] ? '0px' : R + 'px'
          el.style.borderRadius = `14px ${br} ${br} 0px`
        } else {
          el.style.borderRadius = `0px ${sameAbove ? 0 : R}px ${isLast ? R : sameBelow ? 0 : R}px ${isLast ? R : 0}px`
        }
      })
    }, 120)
    return () => clearTimeout(timer)
  }, [])

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
              data-hero-block={key}
              style={{
                position: 'relative',
                zIndex: BLOCKS.length - key,
                background: bg,
                color,
                fontWeight: 800,
                fontSize: isHat ? 14 : 13.5,
                padding: isHat ? '11px 16px 13px' : '13px 16px 11px',
                borderRadius: isHat ? '14px 14px 0 0' : isLast ? '0 0 14px 14px' : 0,
                boxShadow: '0 2px 0 rgba(0,0,0,.18)',
                display: 'inline-flex',
                gap: 7,
                alignItems: 'center',
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
