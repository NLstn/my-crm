import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { Input } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not render helper text when error is present', () => {
      render(
        <Input
          error="Error message"
          helperText="Helper text"
        />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('renders with left icon', () => {
      render(
        <Input
          leftIcon={<span data-testid="left-icon">🔍</span>}
          placeholder="Search"
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <Input
          rightIcon={<span data-testid="right-icon">✓</span>}
          placeholder="Enter value"
        />
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input--default');
    });

    it('applies error variant when error prop is provided', () => {
      render(<Input data-testid="input" error="Error" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input--error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('input--md');
    });

    it('applies small size', () => {
      render(<Input data-testid="input" size="sm" />);
      expect(screen.getByTestId('input')).toHaveClass('input--sm');
    });

    it('applies large size', () => {
      render(<Input data-testid="input" size="lg" />);
      expect(screen.getByTestId('input')).toHaveClass('input--lg');
    });
  });

  describe('Full Width', () => {
    it('applies full width class when prop is true', () => {
      render(<Input data-testid="input" fullWidth />);
      expect(screen.getByTestId('input')).toHaveClass('input--full-width');
    });

    it('does not apply full width class by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).not.toHaveClass('input--full-width');
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled class', () => {
      render(<Input data-testid="input" disabled />);
      expect(screen.getByTestId('input')).toHaveClass('input--disabled');
    });
  });

  describe('Interactions', () => {
    it('handles onChange event', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello');
    });

    it('handles onFocus event', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur event', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('associates label with input using htmlFor and id', () => {
      render(<Input label="Username" id="username-input" />);
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    it('generates id from label if id is not provided', () => {
      render(<Input label="Email Address" />);
      const input = screen.getByLabelText(/Email Address/);
      expect(input).toHaveAttribute('id', 'input-email-address');
    });

    it('links error message with aria-describedby', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(screen.getByText('Invalid email')).toHaveAttribute('id', errorId!);
    });

    it('links helper text with aria-describedby', () => {
      render(<Input label="Password" helperText="Must be 8 characters" />);
      const input = screen.getByLabelText('Password');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();
      expect(screen.getByText('Must be 8 characters')).toHaveAttribute('id', helperId!);
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Custom Props', () => {
    it('accepts and applies custom className', () => {
      render(<Input data-testid="input" className="custom-class" />);
      expect(screen.getByTestId('input')).toHaveClass('custom-class');
    });

    it('accepts input type prop', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('accepts value prop', () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    it('accepts placeholder prop', () => {
      render(<Input placeholder="Enter text here" />);
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('accepts name prop', () => {
      render(<Input name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });
  });
});
