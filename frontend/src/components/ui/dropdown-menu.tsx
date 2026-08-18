/* eslint-disable react-refresh/only-export-components -- Portage shadcn/ui : un fichier
   exporte volontairement plusieurs composants + constantes (convention du repo). */
import { Menu } from '@base-ui/react/menu'
import type { ReactNode } from 'react'
import { Check, ChevronRight } from 'lucide-react'

/**
 * DropdownMenu (portage shadcn/ui — style base-nova).
 * Composition : Root > Trigger + Content (Group > Label/Item/Checkbox/Radio,
 * Sub > SubTrigger + SubContent, Separator, Shortcut).
 */
export const DropdownMenu = Menu.Root
export const DropdownMenuPortal = Menu.Portal
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group

const contentBase =
  'bg-surface2 border border-border rounded-md shadow-[0_14px_36px_rgba(0,0,0,.5)] p-1.5 min-w-[210px] outline-none z-[200]'

export function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 6,
  style,
  className,
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
        <Menu.Popup className={`${contentBase} ${className ?? ''}`} style={style} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export function DropdownMenuLabel({ inset = false, style, ...props }: React.ComponentProps<typeof Menu.GroupLabel> & { inset?: boolean }) {
  return (
    <Menu.GroupLabel
      data-inset={inset}
      className={`px-3 pt-1.5 pb-1 text-[12px] font-extrabold text-text-muted tracking-[.04em] uppercase ${inset ? 'pl-6' : 'pl-3'}`}
      style={style}
      {...props}
    />
  )
}

const itemBase =
  'flex items-center gap-[9px] w-full box-border py-2 px-3 rounded-sm border-none bg-transparent text-[13.5px] font-bold font-[inherit] cursor-pointer text-left'

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
      className={`${itemBase} ${inset ? 'pl-6' : 'pl-3'}`}
      style={(state) => ({
        color: variant === 'destructive'
          ? state.highlighted
            ? 'var(--color-error-light)'
            : 'var(--color-text)'
          : state.highlighted
            ? 'var(--color-accent-light)'
            : 'var(--color-text)',
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
      className={`${itemBase} ${inset ? 'pl-6' : 'pl-3'} pr-[30px]`}
      style={(state) => ({
        color: state.highlighted ? 'var(--color-accent-light)' : 'var(--color-text)',
        background: state.highlighted ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      <span className="absolute right-2.5 flex items-center">
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
      className={`${itemBase} ${inset ? 'pl-6' : 'pl-3'} pr-[30px]`}
      style={(state) => ({
        color: state.highlighted ? 'var(--color-accent-light)' : 'var(--color-text)',
        background: state.highlighted ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      <span className="absolute right-2.5 flex items-center">
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
      className="h-px bg-border my-[5px] mx-1.5"
      style={style}
      {...props}
    />
  )
}

export function DropdownMenuShortcut({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className="ml-auto text-[12px] tracking-[.05em] text-text-dim"
      style={style}
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
      className={`${itemBase} ${inset ? 'pl-6' : 'pl-3'}`}
      style={(state) => ({
        color: state.highlighted || state.open ? 'var(--color-accent-light)' : 'var(--color-text)',
        background: state.highlighted || state.open ? 'rgba(255,255,255,.06)' : 'transparent',
        ...(typeof style === 'function' ? style(state) : style),
      })}
      {...props}
    >
      {children}
      <ChevronRight size={14} className="ml-auto opacity-70" />
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
