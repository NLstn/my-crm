import { type ChangeEvent } from 'react'
import { Select } from '@/components/ui'
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext'

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'system', label: 'Match system setting', description: 'Automatically follows your operating system preference.' },
  { value: 'light', label: 'Light mode', description: 'Always use a bright interface optimized for daytime environments.' },
  { value: 'dark', label: 'Dark mode', description: 'Always use a dimmed interface suited for low-light conditions.' },
]

export default function UserPreferences() {
  const { preference, setThemePreference, resolvedTheme } = useTheme()

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setThemePreference(event.target.value as ThemePreference)
  }

  const activeOption = THEME_OPTIONS.find((option) => option.value === preference) ?? THEME_OPTIONS[0]
  const effectiveThemeLabel = resolvedTheme === 'dark' ? 'Dark' : 'Light'

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User preferences</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize how the CRM looks and feels just for you. These settings only apply to your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose how the interface should handle light and dark modes across the application.
            </p>
          </div>

          <Select
            label="Color theme"
            name="theme"
            value={preference}
            onChange={handleThemeChange}
            options={THEME_OPTIONS.map(({ value, label }) => ({ value, label }))}
          />

          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current selection</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{activeOption.description}</p>
            </div>
            <div className="rounded-md bg-white dark:bg-gray-950 px-3 py-2 border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Effective theme: <span className="font-medium text-gray-900 dark:text-gray-100">{effectiveThemeLabel}</span>
              </p>
              {preference === 'system' && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Automatically updates whenever your device switches between light and dark modes.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
