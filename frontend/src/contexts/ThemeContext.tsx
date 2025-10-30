import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  themePreference: ThemePreference
  resolvedTheme: ResolvedTheme
  setThemePreference: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const getSystemTheme = (): ResolvedTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const getStoredThemePreference = (): ThemePreference => {
    const stored = localStorage.getItem('theme') as ThemePreference | null
    return stored || 'system'
  }

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getStoredThemePreference)

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const preference = getStoredThemePreference()
    if (preference === 'system') {
      return getSystemTheme()
    }
    return preference
  })

  useEffect(() => {
    const updateResolvedTheme = () => {
      const newResolvedTheme = themePreference === 'system' ? getSystemTheme() : themePreference
      setResolvedTheme(newResolvedTheme)
      
      const root = document.documentElement
      if (newResolvedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    updateResolvedTheme()
    localStorage.setItem('theme', themePreference)

    // Listen for system theme changes when in system mode
    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => updateResolvedTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [themePreference])

  const setThemePreference = (theme: ThemePreference) => {
    setThemePreferenceState(theme)
  }

  const toggleTheme = () => {
    setThemePreferenceState(prev => {
      // Only toggle between light and dark, not system
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      // If currently 'system', toggle to opposite of current resolved theme
      return resolvedTheme === 'light' ? 'dark' : 'light'
    })
  }

  return (
    <ThemeContext.Provider value={{ themePreference, resolvedTheme, setThemePreference, toggleTheme }}>
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
