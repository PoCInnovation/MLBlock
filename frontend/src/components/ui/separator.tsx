import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { theme } from '../../theme'

/**
 * Separator (portage shadcn/ui — registre officiel new-york, style base-nova,
 * sans Tailwind : les classes du registre sont remplacées par le style inline).
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => {
  const vertical = orientation === 'vertical'
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={className}
      style={{
        background: theme.color.border,
        flexShrink: 0,
        ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, width: '100%' }),
      }}
      {...props}
    />
  )
})
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
