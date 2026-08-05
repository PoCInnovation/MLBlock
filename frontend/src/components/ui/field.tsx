import type { CSSProperties, ReactNode } from 'react'
import { theme } from '../../theme'

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 700,
  color: theme.color.textMuted,
}

const errorStyle: CSSProperties = {
  color: theme.color.error,
  fontSize: 12,
  marginTop: -12,
  marginBottom: 12,
}

export function Field({ dataInvalid, children }: { dataInvalid?: boolean; children: ReactNode }) {
  return <div data-invalid={dataInvalid}>{children}</div>
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={labelStyle}>
      {children}
    </label>
  )
}

export function FieldError({ errors }: { errors?: Array<{ message?: string } | undefined> }) {
  const message = errors?.[0]?.message
  if (!message) return null
  return (
    <div role="alert" style={errorStyle}>
      {message}
    </div>
  )
}
