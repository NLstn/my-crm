import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text for the input field
   */
  label?: string
  /**
   * Error message to display below the input
   */
  error?: string
  /**
   * Additional CSS classes to apply to the input
   */
  className?: string
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label text for the textarea field
   */
  label?: string
  /**
   * Error message to display below the textarea
   */
  error?: string
  /**
   * Additional CSS classes to apply to the textarea
   */
  className?: string
}

/**
 * Input component - A reusable text input with optional label and error message
 * 
 * Includes dark mode support and consistent styling
 * For multi-line text input, use Textarea component
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   name="email"
 *   value={email}
 *   onChange={handleChange}
 *   required
 * />
 * 
 * <Input
 *   label="Phone"
 *   type="tel"
 *   name="phone"
 *   value={phone}
 *   onChange={handleChange}
 *   error={phoneError}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name
    const inputClass = `input ${className}`.trim()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label} {props.required && '*'}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClass}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Textarea component - A reusable multi-line text input with optional label and error message
 * 
 * Includes dark mode support and consistent styling
 * For single-line text input, use Input component
 * 
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   name="description"
 *   value={description}
 *   onChange={handleChange}
 *   rows={4}
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name
    const textareaClass = `input ${className}`.trim()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="label">
            {label} {props.required && '*'}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClass}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
