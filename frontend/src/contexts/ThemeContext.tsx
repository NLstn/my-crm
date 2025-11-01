import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setThemePreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') {
      return 'system'
    }

    const stored = window.localStorage.getItem('theme') as ThemePreference | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }

    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('theme', preference)
  }, [preference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const updateResolvedTheme = () => {
      const nextResolved: ResolvedTheme =
        preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light'
      setResolvedTheme(nextResolved)
    }

    updateResolvedTheme()

    if (preference === 'system') {
      media.addEventListener('change', updateResolvedTheme)
      return () => {
        media.removeEventListener('change', updateResolvedTheme)
      }
    }

    return undefined
  }, [preference])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const setThemePreference = (nextPreference: ThemePreference) => {
    setPreference(nextPreference)
  }

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
