import type { ReactNode } from 'react'

export function Field({ dataInvalid, children }: { dataInvalid?: boolean; children: ReactNode }) {
  return <div data-invalid={dataInvalid}>{children}</div>
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5 text-[13px] font-bold text-text-muted">
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
