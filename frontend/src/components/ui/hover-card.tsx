/* eslint-disable react-refresh/only-export-components -- Portage shadcn/ui : un fichier
   exporte volontairement plusieurs composants + constantes (convention du repo). */
import { PreviewCard } from '@base-ui/react/preview-card'

/**
 * HoverCard (portage shadcn/ui — style base-nova).
 * Composition : HoverCard > HoverCardTrigger + HoverCardContent.
 */
export const HoverCard = PreviewCard.Root
export const HoverCardTrigger = PreviewCard.Trigger

export function HoverCardContent({
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 4,
  style,
  className,
  ...props
}: React.ComponentProps<typeof PreviewCard.Popup> & {
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}) {
  return (
    <PreviewCard.Portal data-slot="hover-card-portal">
      <PreviewCard.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset}>
        <PreviewCard.Popup
          data-slot="hover-card-content"
          className={`bg-surface2 border border-border rounded-md shadow-[0_14px_36px_rgba(0,0,0,.5)] p-md min-w-[200px] text-[13px] text-text outline-none z-[200] ${className ?? ''}`}
          style={style}
          {...props}
        />
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  )
}
