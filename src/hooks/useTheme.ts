import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('theme', theme)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
  }, [theme])

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(nextTheme)
      }
    }

    window.addEventListener('theme-change', syncTheme)
    return () => window.removeEventListener('theme-change', syncTheme)
  }, [])

  return {
    theme,
    toggleTheme: () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }
}
