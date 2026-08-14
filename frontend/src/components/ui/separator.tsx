import type { CSSProperties } from 'react'
import { theme } from '../../theme'

/**
 * Separator (portage shadcn/ui — style base-nova, sans Tailwind).
 * Simple div : séparateur horizontal (défaut) ou vertical.
 */
export function Separator({ orientation = 'horizontal', style, ...props }: React.ComponentProps<'div'> & { orientation?: 'horizontal' | 'vertical'; style?: CSSProperties }) {
  const vertical = orientation === 'vertical'
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      role="separator"
      style={{
        background: theme.color.border,
        flexShrink: 0,
        ...(vertical ? { width: 1, height: '100%' } : { height: 1, width: '100%' }),
        ...style,
      }}
      {...props}
    />
  )
}
