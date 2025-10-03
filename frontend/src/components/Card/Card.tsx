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
  /** Optional header title */
  title?: string;
  /** Optional header subtitle/description */
  subtitle?: string;
  /** Optional icon for the header (emoji or ReactNode) */
  icon?: ReactNode;
  /** Optional action element to render in the header (e.g., a button) */
  headerAction?: ReactNode;
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
 * // Section card with header
 * <Card variant="section" title="Contacts" headerAction={<Button>Add</Button>}>
 *   <p>Section content</p>
 * </Card>
 * 
 * @example
 * // Card with icon and subtitle
 * <Card variant="section" icon="👥" title="Accounts" subtitle="Manage your accounts">
 *   <p>Card content</p>
 * </Card>
 */
export const Card: FC<CardProps> = ({ 
  variant = 'default',
  children,
  className = '',
  as,
  onClick,
  disabled,
  title,
  subtitle,
  icon,
  headerAction,
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
  const { variant: _, as: __, title: ___, subtitle: ____, icon: _____, headerAction: ______, ...htmlProps } = rest;

  // Render the header if title is provided
  const renderHeader = () => {
    if (!title && !icon) return null;

    return (
      <div className="card__header">
        {icon && <span className="card__header-icon">{icon}</span>}
        <div className="card__header-content">
          {title && <h2 className="card__header-title">{title}</h2>}
          {subtitle && <p className="card__header-subtitle">{subtitle}</p>}
        </div>
        {headerAction && <div className="card__header-action">{headerAction}</div>}
      </div>
    );
  };

  const content = (
    <>
      {renderHeader()}
      {children && <div className="card__body">{children}</div>}
    </>
  );

  if (isButton) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick as (event: MouseEvent<HTMLButtonElement>) => void}
        disabled={disabled}
        {...(htmlProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={classes} {...(htmlProps as HTMLAttributes<HTMLDivElement>)}>
      {content}
    </div>
  );
};
