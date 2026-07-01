import React from 'react'
import type { Category } from '../../types/catalog'

const ICONS: Record<string, React.ReactNode> = {
  data: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <rect x="2" y="3"   width="14" height="3" rx="1.5" fill="#fff" />
      <rect x="2" y="7.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".72" />
      <rect x="2" y="12"  width="14" height="3" rx="1.5" fill="#fff" opacity=".46" />
    </svg>
  ),
  prep: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6"  x2="15" y2="6" />
        <line x1="3" y1="12" x2="15" y2="12" />
      </g>
      <circle cx="7"  cy="6"  r="2.5" fill="#fff" />
      <circle cx="12" cy="12" r="2.5" fill="#fff" />
    </svg>
  ),
  model: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <g stroke="#fff" strokeWidth="1.7">
        <line x1="5" y1="5"  x2="13" y2="9" />
        <line x1="5" y1="13" x2="13" y2="9" />
      </g>
      <circle cx="5"  cy="5"  r="2.5" fill="#fff" />
      <circle cx="5"  cy="13" r="2.5" fill="#fff" />
      <circle cx="13" cy="9"  r="2.7" fill="#fff" />
    </svg>
  ),
  train: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <polyline points="3,14 7,9 10,11 15,4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eval: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="6.4" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="9" cy="9" r="2.2" fill="#fff" />
    </svg>
  ),
  control: (
    <svg width="19" height="19" viewBox="0 0 18 18">
      <polygon points="9,2.5 15.5,9 9,15.5 2.5,9" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
}

type CategoryIconProps = {
  cat: Category & { onClick: () => void }
  selected: boolean
}

export default function CategoryIcon({ cat, selected }: CategoryIconProps) {
  return (
    <div
      onClick={cat.onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '10px 4px', borderRadius: 13, cursor: 'pointer',
        color: selected ? '#f5efe9' : '#9c938a',
        background: selected ? 'rgba(255,255,255,.07)' : 'transparent',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 13, background: cat.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(255,255,255,.28)' : '0 2px 0 rgba(0,0,0,.2)',
      }}>
        {ICONS[cat.id]}
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', lineHeight: 1.15 }}>{cat.name}</span>
    </div>
  )
}
