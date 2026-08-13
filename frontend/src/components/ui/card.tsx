import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { theme } from '../../theme'

/**
 * Card (portage shadcn/ui — style base-nova, sans Tailwind).
 * Structure : Card > CardHeader (CardTitle + CardDescription + CardAction)
 * + CardContent + CardFooter.
 */
export function Card({ size = 'default', style, ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm'; style?: CSSProperties }) {
  const gap = size === 'sm' ? 10 : 14
  return (
    <div
      data-slot="card"
      data-size={size}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRadius: theme.radius.lg,
        background: theme.color.surface3,
        color: theme.color.text,
        fontSize: 13,
        border: `1px solid ${theme.color.border}`,
        padding: `${gap}px ${gap}px 0`,
        ...style,
      }}
      {...props}
    />
  )
}

export function CardHeader({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-header"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gridAutoRows: 'min-content',
        alignItems: 'start',
        gap: 6,
        padding: '10px 0',
        ...style,
      }}
      {...props}
    />
  )
}

export const CardTitle = forwardRef<HTMLDivElement, React.ComponentProps<'div'> & { style?: CSSProperties }>(function CardTitle({ style, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-title"
      style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.3, color: theme.color.textLight, ...style }}
      {...props}
    />
  )
})

export function CardDescription({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-description"
      style={{ fontSize: 12, color: theme.color.textMuted, ...style }}
      {...props}
    />
  )
}

export function CardAction({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-action"
      style={{ justifySelf: 'end', alignSelf: 'start', ...style }}
      {...props}
    />
  )
}

export function CardContent({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-content"
      style={{ flex: 1, minHeight: 0, ...style }}
      {...props}
    />
  )
}

export function CardFooter({ style, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties }) {
  return (
    <div
      data-slot="card-footer"
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '0 -14px',
        borderTop: `1px solid ${theme.color.border}`,
        background: 'rgba(255,255,255,.03)',
        borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        padding: 8,
        fontSize: 11,
        fontWeight: 800,
        color: theme.color.textMuted,
        ...style,
      }}
      {...props}
    />
  )
}
