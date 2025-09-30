import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button>Primary Button</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('button--primary');

    rerender(<Button variant="secondary">Secondary Button</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('button--secondary');

    rerender(<Button variant="ghost">Ghost Button</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('button--ghost');

    rerender(<Button variant="danger">Danger Button</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('button--danger');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('button--sm');

    rerender(<Button size="md">Medium Button</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('button--md');

    rerender(<Button size="lg">Large Button</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('button--lg');
  });

  it('renders full width when specified', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('button--full-width');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled Button
      </Button>
    );
    
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('has correct button type', () => {
    const { rerender } = render(<Button>Default Type</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');

    rerender(<Button type="submit">Submit Button</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
    expect(button.className).toContain('button');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Keyboard Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
