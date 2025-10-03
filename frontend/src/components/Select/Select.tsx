import { FC, SelectHTMLAttributes, ReactNode } from 'react';
import './Select.css';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * The visual style variant of the select
   * - default: Standard select style
   * - error: Select with error state styling
   */
  variant?: 'default' | 'error';
  
  /**
   * The size of the select
   * - sm: Small select
   * - md: Medium select (default)
   * - lg: Large select
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the select should take full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Label text for the select
   */
  label?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Error message to display below the select
   */
  error?: string;
  
  /**
   * Helper text to display below the select
   */
  helperText?: string;
  
  /**
   * Options to display in the select
   */
  children: ReactNode;
}

export const Select: FC<SelectProps> = ({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  label,
  required = false,
  error,
  helperText,
  className = '',
  id,
  disabled = false,
  children,
  ...props
}) => {
  // Determine the actual variant based on error prop
  const actualVariant = error ? 'error' : variant;
  
  const selectWrapperClass = [
    'select-wrapper',
    `select-wrapper--${size}`,
    fullWidth && 'select-wrapper--full-width',
    disabled && 'select-wrapper--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  const selectClass = [
    'select',
    `select--${actualVariant}`,
    `select--${size}`,
    fullWidth && 'select--full-width',
    disabled && 'select--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Generate a unique ID if not provided
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={selectWrapperClass}>
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}
      
      <div className="select__field-wrapper">
        <select
          id={selectId}
          className={selectClass}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {children}
        </select>
      </div>
      
      {error && (
        <span
          id={`${selectId}-error`}
          className="select__message select__message--error"
          role="alert"
        >
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span
          id={`${selectId}-helper`}
          className="select__message select__message--helper"
        >
          {helperText}
        </span>
      )}
    </div>
  );
};
