/* Astryx HoverCard — deep: single seam, was @base-ui/react PreviewCard shim.
   BlockSegments now imports HoverCard directly from @astryxdesign/core.
   This file remains as a deprecated re-export for any lingering import.
*/
export { HoverCard } from '@astryxdesign/core/HoverCard'
export { HoverCard as HoverCardTrigger } from '@astryxdesign/core/HoverCard'
export function HoverCardContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
