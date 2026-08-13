import { Menu } from '@base-ui/react/menu'
import type { ReactNode } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { theme } from '../../theme'

/**
 * DropdownMenu (portage shadcn/ui — style base-nova, sans Tailwind).
 * Composition : Root > Trigger + Content (Group > Label/Item/Checkbox/Radio,
 * Sub > SubTrigger + SubContent, Separator, Shortcut).
 */
export const DropdownMenu = Menu.Root
export const DropdownMenuPortal = Menu.Portal
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group

const contentBase: React.CSSProperties = {
  background: theme.color.surface2,
  border: `1px solid ${theme.color.border}`,
  borderRadius: theme.radius.md,
  boxShadow: '0 14px 36px rgba(0,0,0,.5)',
  padding: 6,
  minWidth: 210,
  outline: 'none',
  zIndex: 200,
}

export function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 6,
  style,
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset}>
        <Menu.Popup style={{ ...contentBase, ...style }} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export function DropdownMenuLabel({ inset = false, style, ...props }: React.ComponentProps<typeof Menu.GroupLabel> & { inset?: boolean }) {
  return (
    <Menu.GroupLabel
      data-inset={inset}
      style={{
        padding: '6px 12px 4px',
        paddingLeft: inset ? 24 : 12,
        fontSize: 11,
        fontWeight: 800,
        color: theme.color.textMuted,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        ...style,
      }}
      {...props}
    />
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
  variant = 'default',
  inset = false,
  style,
  ...props
}: React.ComponentProps<typeof Menu.Item> & { variant?: 'default' | 'destructive'; inset?: boolean }) {
  return (
    <Menu.Item
      data-variant={variant}
      data-inset={inset}
      style={(state) => ({
        ...itemBase,
        paddingLeft: inset ? 24 : 12,
        color: variant === 'destructive'
          ? theme.color.errorLight
          : state.highlighted
            ? theme.color.accentLight
            : theme.color.text,
        background: state.highlighted
          ? variant === 'destructive' ? 'rgba(239,68,68,.14)' : 'rgba(255,255,255,.06)'
          : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    />
  )
}

export function DropdownMenuCheckboxItem({ inset = false, style, ...props }: React.ComponentProps<typeof Menu.CheckboxItem> & { inset?: boolean }) {
  return (
    <Menu.CheckboxItem
      data-inset={inset}
      style={(state) => ({
        ...itemBase,
        paddingLeft: inset ? 24 : 12,
        paddingRight: 30,
        color: state.highlighted ? theme.color.accentLight : theme.color.text,
        background: state.highlighted ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      <span style={{ position: 'absolute', right: 10, display: 'flex', alignItems: 'center' }}>
        <Menu.CheckboxItemIndicator>
          <Check size={14} />
        </Menu.CheckboxItemIndicator>
      </span>
      {props.children}
    </Menu.CheckboxItem>
  )
}

export function DropdownMenuRadioGroup(props: React.ComponentProps<typeof Menu.RadioGroup>) {
  return <Menu.RadioGroup {...props} />
}

export function DropdownMenuRadioItem({ inset = false, style, ...props }: React.ComponentProps<typeof Menu.RadioItem> & { inset?: boolean }) {
  return (
    <Menu.RadioItem
      data-inset={inset}
      style={(state) => ({
        ...itemBase,
        paddingLeft: inset ? 24 : 12,
        paddingRight: 30,
        color: state.highlighted ? theme.color.accentLight : theme.color.text,
        background: state.highlighted ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      <span style={{ position: 'absolute', right: 10, display: 'flex', alignItems: 'center' }}>
        <Menu.RadioItemIndicator>
          <Check size={14} />
        </Menu.RadioItemIndicator>
      </span>
      {props.children}
    </Menu.RadioItem>
  )
}

export function DropdownMenuSeparator({ style, ...props }: React.ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      style={{ height: 1, background: theme.color.border, margin: '5px 6px', ...style }}
      {...props}
    />
  )
}

export function DropdownMenuShortcut({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        marginLeft: 'auto',
        fontSize: 11,
        letterSpacing: '.05em',
        color: theme.color.textDim,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function DropdownMenuSub(props: React.ComponentProps<typeof Menu.SubmenuRoot>) {
  return <Menu.SubmenuRoot {...props} />
}

export function DropdownMenuSubTrigger({ inset = false, children, style, ...props }: React.ComponentProps<typeof Menu.SubmenuTrigger> & { inset?: boolean }) {
  return (
    <Menu.SubmenuTrigger
      data-inset={inset}
      style={(state) => ({
        ...itemBase,
        paddingLeft: inset ? 24 : 12,
        color: state.highlighted || state.open ? theme.color.accentLight : theme.color.text,
        background: state.highlighted || state.open ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      {children}
      <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
    </Menu.SubmenuTrigger>
  )
}

export function DropdownMenuSubContent({
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  style,
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}) {
  return (
    <DropdownMenuContent
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      style={{ minWidth: 140, ...style }}
      {...props}
    />
  )
}
