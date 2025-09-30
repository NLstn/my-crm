import { FC, ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * - primary: Main action button with primary color
   * - secondary: Secondary action with outlined style
   * - ghost: Text-only button without background
   * - danger: Destructive action button
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  
  /**
   * The size of the button
   * - sm: Small button
   * - md: Medium button (default)
   * - lg: Large button
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button should take full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Button content
   */
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const buttonClass = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    disabled && 'button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
