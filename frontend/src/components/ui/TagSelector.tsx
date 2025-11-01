export interface TagOption {
  id: number
  label: string
}

interface TagSelectorProps {
  label?: string
  options: TagOption[]
  value: number[]
  onChange: (nextValue: number[]) => void
  disabled?: boolean
  helperText?: string
}

export function TagSelector({
  label,
  options,
  value,
  onChange,
  disabled = false,
  helperText,
}: TagSelectorProps) {
  const toggleTag = (tagId: number) => {
    if (disabled) {
      return
    }

    const isSelected = value.includes(tagId)
    if (isSelected) {
      onChange(value.filter(id => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  return (
    <div className="w-full">
      {label && <div className="label mb-2">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = value.includes(option.id)
          const baseClasses =
            'px-3 py-1 rounded-full text-sm border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
          const selectedClasses =
            'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900 dark:text-primary-200 dark:border-primary-700'
          const unselectedClasses =
            'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'

          return (
            <button
              key={option.id}
              type="button"
              className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
              onClick={() => toggleTag(option.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          )
        })}
        {options.length === 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            No tags available. Create tags from the admin panel.
          </span>
        )}
      </div>
      {helperText && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}
