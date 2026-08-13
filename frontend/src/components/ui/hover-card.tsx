import { PreviewCard } from '@base-ui/react/preview-card'
import { theme } from '../../theme'

/**
 * HoverCard (portage shadcn/ui — style base-nova, sans Tailwind).
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
          style={{
            background: theme.color.surface2,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.md,
            boxShadow: '0 14px 36px rgba(0,0,0,.5)',
            padding: 12,
            minWidth: 200,
            fontSize: 13,
            color: theme.color.text,
            outline: 'none',
            zIndex: 200,
            ...style,
          }}
          {...props}
        />
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  )
}
