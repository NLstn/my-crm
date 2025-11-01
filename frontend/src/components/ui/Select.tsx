import { SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  placeholder?: string
  className?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      className = '',
      id,
      children,
      multiple,
      ...props
    },
    ref,
  ) => {
    const selectId = id || props.name
    const selectClass = `input ${className}`.trim()
    const showPlaceholder = Boolean(placeholder) && !multiple

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label">
            {label} {props.required && '*'}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={selectClass}
          aria-invalid={Boolean(error)}
          {...props}
          multiple={multiple}
        >
          {showPlaceholder && <option value="">{placeholder}</option>}
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        {helperText && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
