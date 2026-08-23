import type { CSSProperties, ReactNode } from 'react'
import { Card as AstryxCard, ClickableCard as AstryxClickableCard } from '@astryxdesign/core'

/** Astryx Card wrapper — preserves legacy size prop while using Astryx variant/padding. */
export function Card({ size = 'default', style, children, className, ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm'; style?: CSSProperties; children?: ReactNode; className?: string }) {
  const padding = size === 'sm' ? 3 : 4
  return (
    <AstryxCard padding={padding as 3 | 4} style={style} className={className} {...props}>
      {children}
    </AstryxCard>
  )
}

export function ClickableCard(props: React.ComponentProps<typeof AstryxClickableCard>) {
  return <AstryxClickableCard {...props} />
}

export function CardHeader({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-header" className={className} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, paddingBlock: 10, ...style }} {...props}>{children}</div>
}

export function CardTitle({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-title" className={className} style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.3, color: 'var(--color-text-light)', ...style }} {...props}>{children}</div>
}

export function CardDescription({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-description" className={className} style={{ fontSize: 12, color: 'var(--color-text-muted)', ...style }} {...props}>{children}</div>
}

export function CardAction({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-action" className={className} style={{ justifySelf: 'end', alignSelf: 'start', ...style }} {...props}>{children}</div>
}

export function CardContent({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-content" className={className} style={{ flex: '1 1 auto', minHeight: 0, ...style }} {...props}>{children}</div>
}

export function CardFooter({ style, children, className, ...props }: React.ComponentProps<'div'> & { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return <div data-slot="card-footer" className={className} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--color-border)', padding: 8, fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', ...style }} {...props}>{children}</div>
}
