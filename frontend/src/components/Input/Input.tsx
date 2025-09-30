import { FC, InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The visual style variant of the input
   * - default: Standard input style
   * - error: Input with error state styling
   */
  variant?: 'default' | 'error';
  
  /**
   * The size of the input
   * - sm: Small input
   * - md: Medium input (default)
   * - lg: Large input
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the input should take full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Label text for the input
   */
  label?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Error message to display below the input
   */
  error?: string;
  
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  
  /**
   * Icon to display on the left side of the input
   */
  leftIcon?: ReactNode;
  
  /**
   * Icon to display on the right side of the input
   */
  rightIcon?: ReactNode;
}

export const Input: FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  label,
  required = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  disabled = false,
  ...props
}) => {
  // Determine the actual variant based on error prop
  const actualVariant = error ? 'error' : variant;
  
  const inputWrapperClass = [
    'input-wrapper',
    `input-wrapper--${size}`,
    fullWidth && 'input-wrapper--full-width',
    disabled && 'input-wrapper--disabled',
    leftIcon && 'input-wrapper--with-left-icon',
    rightIcon && 'input-wrapper--with-right-icon',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClass = [
    'input',
    `input--${actualVariant}`,
    `input--${size}`,
    fullWidth && 'input--full-width',
    disabled && 'input--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Generate a unique ID if not provided
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={inputWrapperClass}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      
      <div className="input__field-wrapper">
        {leftIcon && (
          <span className="input__icon input__icon--left">
            {leftIcon}
          </span>
        )}
        
        <input
          id={inputId}
          className={inputClass}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <span className="input__icon input__icon--right">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && (
        <span
          id={`${inputId}-error`}
          className="input__message input__message--error"
          role="alert"
        >
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span
          id={`${inputId}-helper`}
          className="input__message input__message--helper"
        >
          {helperText}
        </span>
      )}
    </div>
  );
};
