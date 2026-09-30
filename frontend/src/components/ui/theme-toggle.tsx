import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from './button'

const emptySubscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // Sync data-theme attribute on documentElement for MLBlock compatibility
  React.useEffect(() => {
    if (resolvedTheme) {
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }
  }, [resolvedTheme])

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Basculer le thème"
      >
        <span className="size-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {isDark ? (
        <Sun className="size-4 text-accent-light transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-foreground transition-transform hover:-rotate-12" />
      )}
    </Button>
  )
}
