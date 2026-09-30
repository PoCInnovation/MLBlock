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
    <label htmlFor={htmlFor} className="block mb-1.5 text-xs font-bold text-text-muted">
      {children}
    </label>
  )
}

export function FieldError({ errors }: { errors?: Array<{ message?: string } | undefined> }) {
  const message = errors?.[0]?.message
  if (!message) return null
  return (
    <div role="alert" className="text-error text-xs -mt-3 mb-3">
      {message}
    </div>
  )
}

export const FormLayout = AstryxFormLayout
