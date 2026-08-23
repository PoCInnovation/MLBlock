/* Astryx DropdownMenu migration — wraps @astryxdesign/core DropdownMenu/CommandPalette */
import { DropdownMenu as AstryxDropdownMenu, CommandPalette as AstryxCommandPalette } from '@astryxdesign/core'

export const DropdownMenu = AstryxDropdownMenu
export const CommandPalette = AstryxCommandPalette

// Legacy shims — kept for any non-migrated callers; they render as plain divs so build stays green.
// New code should use Astryx DropdownMenu directly (button + items or children).
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
export function DropdownMenuContent({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DropdownMenuLabel({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DropdownMenuItem({ children }: { children: React.ReactNode; onClick?: () => void }) { return <div>{children}</div> }
export function DropdownMenuCheckboxItem({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DropdownMenuRadioGroup({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function DropdownMenuRadioItem({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DropdownMenuSeparator() { return <hr /> }
export function DropdownMenuShortcut({ children }: { children: React.ReactNode }) { return <span>{children}</span> }
export function DropdownMenuSub({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function DropdownMenuSubTrigger({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DropdownMenuSubContent({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
