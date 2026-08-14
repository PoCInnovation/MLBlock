import { forwardRef } from 'react'
import type { CSSProperties } from 'react'

/**
 * Card (portage shadcn/ui — style base-nova).
 * Structure : Card > CardHeader (CardTitle + CardDescription + CardAction)
 * + CardContent + CardFooter.
 */
export function Card({ size = 'default', style, ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm'; style?: CSSProperties }) {
  const sizeClass = size === 'sm' ? 'gap-md p-md pt-0' : 'gap-lg p-lg pt-0'
  return (
    <div
      data-slot="card"
      data-size={size}
      className={`flex flex-col ${sizeClass} overflow-hidden box-border rounded-lg bg-surface3 text-text text-[13px] border border-border`}
      style={style}
      {...props}
    />
  )
}

export function CardHeader({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-header"
      className="grid grid-cols-[1fr_auto] auto-rows-min items-start gap-1.5 py-2.5"
      style={style}
      {...props}
    />
  )
}

export const CardTitle = forwardRef<HTMLDivElement, React.ComponentProps<'div'> & { style?: CSSProperties }>(function CardTitle({ style, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-title"
      className="font-extrabold text-[13.5px] leading-[1.3] text-text-light"
      style={style}
      {...props}
    />
  )
})

export function CardDescription({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-description"
      className="text-xs text-text-muted"
      style={style}
      {...props}
    />
  )
}

export function CardAction({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-action"
      className="justify-self-end self-start"
      style={style}
      {...props}
    />
  )
}

export function CardContent({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-content"
      className="flex-1 min-h-0"
      style={style}
      {...props}
    />
  )
}

export function CardFooter({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-footer"
      className="flex items-center -mx-lg border-t border-border bg-white/3 rounded-b-lg p-2 text-[11px] font-extrabold text-text-muted"
      style={style}
      {...props}
    />
  )
}
