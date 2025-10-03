import { FC, ReactNode, ButtonHTMLAttributes, HTMLAttributes, MouseEvent } from 'react';
import './Card.css';

export interface CardProps {
  /** Visual variant of the card */
  variant?: 'default' | 'summary' | 'clickable' | 'section';
  /** Child content to render inside the card */
  children: ReactNode;
  /** Optional custom class name */
  className?: string;
  /** Whether the card should be rendered as a button (clickable) */
  as?: 'div' | 'button';
  /** Click handler */
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  /** Disabled state (only for buttons) */
  disabled?: boolean;
  /** Additional HTML attributes */
  [key: string]: unknown;
}

/**
 * Card component - A reusable tile/card container
 * 
 * @example
 * // Default card
 * <Card>Content here</Card>
 * 
 * @example
 * // Clickable card
 * <Card variant="clickable" onClick={handleClick}>
 *   Clickable content
 * </Card>
 * 
 * @example
 * // Summary card (for metrics)
 * <Card variant="summary">
 *   <div className="card__value">42</div>
 *   <div className="card__label">Total Items</div>
 * </Card>
 * 
 * @example
 * // Section card (for content grouping)
 * <Card variant="section">
 *   <h2>Section Title</h2>
 *   <p>Section content</p>
 * </Card>
 */
export const Card: FC<CardProps> = ({ 
  variant = 'default',
  children,
  className = '',
  as,
  onClick,
  disabled,
  ...rest
}) => {
  // Determine if card should be a button based on props
  const isButton = as === 'button' || onClick !== undefined || variant === 'clickable';
  
  const classes = [
    'card',
    `card--${variant}`,
    isButton ? 'card--interactive' : '',
    className
  ].filter(Boolean).join(' ');

  // Remove non-standard HTML attributes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _, as: __, ...htmlProps } = rest;

  if (isButton) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick as (event: MouseEvent<HTMLButtonElement>) => void}
        disabled={disabled}
        {...(htmlProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={classes} {...(htmlProps as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
};
