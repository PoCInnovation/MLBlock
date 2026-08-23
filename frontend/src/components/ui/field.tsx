import type { ReactNode } from 'react'
import { Field as AstryxField, FormLayout as AstryxFormLayout } from '@astryxdesign/core'

export function Field({ dataInvalid, children, label, inputID, status }: { dataInvalid?: boolean; children: ReactNode; label?: string; inputID?: string; status?: { type: 'error' | 'warning' | 'success'; message?: string } }) {
  // When used with Astryx props (label/inputID/status), delegate to Astryx Field
  if (label && inputID) {
    return (
      <AstryxField label={label} inputID={inputID} status={dataInvalid ? { type: 'error', message: status?.message } : status}>
        {children}
      </AstryxField>
    )
  }
  // Legacy wrapper (LoginPage etc) — keep data-invalid attribute for CSS
  return <div data-invalid={dataInvalid}>{children}</div>
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
      {children}
    </label>
  )
}

export function FieldError({ errors }: { errors?: Array<{ message?: string } | undefined> }) {
  const message = errors?.[0]?.message
  if (!message) return null
  return (
    <div role="alert" style={{ color: 'var(--color-error)', fontSize: 12, marginTop: -12, marginBottom: 12 }}>
      {message}
    </div>
  )
}

export const FormLayout = AstryxFormLayout
