import type { ReactNode } from 'react'

export function Field({ dataInvalid, children, label, inputID, status }: { dataInvalid?: boolean; children: ReactNode; label?: string; inputID?: string; status?: { type: 'error' | 'warning' | 'success'; message?: string } }) {
  return (
    <div data-invalid={dataInvalid} className="flex flex-col gap-1.5 mb-3">
      {label && <label htmlFor={inputID} className="text-xs font-bold text-text-muted">{label}</label>}
      {children}
      {status?.message && <div className={`text-xs ${status.type === 'error' ? 'text-error' : 'text-muted-foreground'}`}>{status.message}</div>}
    </div>
  )
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
    <div role="alert" className="text-error text-xs -mt-1 mb-2">
      {message}
    </div>
  )
}

export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}
