import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

/**
 * Button component - A reusable button with consistent styling
 * 
 * Supports three variants: primary, secondary, and danger
 * All variants include dark mode support
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save
 * </Button>
 * 
 * <Button variant="danger" disabled={isLoading}>
 *   Delete
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    const baseClass = 'btn'
    const variantClass = `btn-${variant}`
    const classes = `${baseClass} ${variantClass} ${className}`.trim()

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
