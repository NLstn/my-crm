import { useTheme } from '../contexts/ThemeContext'

export default function UserSettings() {
  const { themePreference, setThemePreference } = useTheme()

  const themeOptions = [
    { value: 'light' as const, label: 'Light', description: 'Always use light theme' },
    { value: 'dark' as const, label: 'Dark', description: 'Always use dark theme' },
    { value: 'system' as const, label: 'System', description: 'Use system preference' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          User Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your preferences and settings
        </p>
      </div>

      {/* Theme Settings Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Theme Preference
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose how the application looks to you
        </p>

        <div className="space-y-3">
          {themeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                themePreference === option.value
                  ? 'border-primary-600 dark:border-primary-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={themePreference === option.value}
                onChange={(e) => setThemePreference(e.target.value as 'light' | 'dark' | 'system')}
                className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
