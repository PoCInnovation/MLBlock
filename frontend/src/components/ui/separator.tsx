import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

/**
 * Separator (portage shadcn/ui — registre officiel new-york, style base-nova).
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, style, ...props }, ref) => {
  const vertical = orientation === 'vertical'
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={`${className ?? ''} bg-border shrink-0 ${vertical ? 'w-px self-stretch' : 'h-px w-full'}`}
      style={style}
      {...props}
    />
  )
})
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
