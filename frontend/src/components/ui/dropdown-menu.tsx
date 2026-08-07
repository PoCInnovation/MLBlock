import { Menu } from '@base-ui/react/menu'
import type { ReactNode } from 'react'
import { theme } from '../../theme'

/** Dropdown menu léger (Base UI) stylé avec les tokens du thème. */
export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({ children }: { children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.Positioner side="bottom" align="end" sideOffset={6}>
        <Menu.Popup
          style={{
            background: theme.color.surface2,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.md,
            boxShadow: '0 14px 36px rgba(0,0,0,.5)',
            padding: 6,
            minWidth: 210,
            outline: 'none',
            zIndex: 200,
          }}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

const itemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: theme.radius.sm,
  border: 'none',
  background: 'transparent',
  fontSize: 13.5,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
}

export function DropdownMenuItem({
  children,
  destructive = false,
  onClick,
}: {
  children: ReactNode
  destructive?: boolean
  onClick?: () => void
}) {
  return (
    <Menu.Item
      onClick={onClick}
      style={(state) => ({
        ...itemBase,
        color: destructive
          ? theme.color.errorLight
          : state.highlighted
            ? theme.color.accentLight
            : theme.color.text,
        background: state.highlighted ? 'rgba(255,255,255,.06)' : 'transparent',
      })}
    >
      {children}
    </Menu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <div role="separator" style={{ height: 1, background: theme.color.border, margin: '5px 6px' }} />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '6px 12px 4px', fontSize: 11, fontWeight: 800, color: theme.color.textMuted, letterSpacing: '.04em', textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}
