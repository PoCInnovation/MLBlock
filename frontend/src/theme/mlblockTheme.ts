import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral'

export const mlblockTheme = defineTheme({
  name: 'mlblock',
  extends: neutralTheme,
  tokens: {
    '--color-accent': '#B8552E',
    '--color-accent-muted': 'rgba(184,85,46,.15)',
    '--color-background-body': ['#F1F4F7', '#171311'],
    '--color-background-surface': ['#FFFFFF', '#1f1916'],
    '--color-background-card': ['#FFFFFF', '#221c19'],
    '--color-background-muted': ['#0536590C', '#251e1a'],
    '--color-text-primary': ['#0A1317', '#f0e9e3'],
    '--color-text-secondary': ['#4E606F', '#b7ada3'],
    '--color-border': ['#CCD3DB', '#3a3531'],
    '--color-success': '#22c55e',
    '--color-success-muted': 'rgba(34,197,94,.15)',
    '--color-error': '#ef4444',
    '--color-error-muted': 'rgba(239,68,68,.15)',
    '--color-warning': '#E8C77A',
  },
})
