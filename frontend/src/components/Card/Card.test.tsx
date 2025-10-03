import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Card>Test content</Card>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as a div by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('div.card')).toBeInTheDocument();
    });

    it('renders as a button when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as a button when as="button" is provided', () => {
      render(<Card as="button">Content</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as a div when as="div" is provided', () => {
      const { container } = render(<Card as="div">Content</Card>);
      expect(container.querySelector('div.card')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant class by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('.card--default')).toBeInTheDocument();
    });

    it('applies summary variant class', () => {
      const { container } = render(<Card variant="summary">Content</Card>);
      expect(container.querySelector('.card--summary')).toBeInTheDocument();
    });

    it('applies clickable variant class', () => {
      const { container } = render(<Card variant="clickable">Content</Card>);
      expect(container.querySelector('.card--clickable')).toBeInTheDocument();
    });

    it('applies section variant class', () => {
      const { container } = render(<Card variant="section">Content</Card>);
      expect(container.querySelector('.card--section')).toBeInTheDocument();
    });

    it('applies interactive class when onClick is provided', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      expect(container.querySelector('.card--interactive')).toBeInTheDocument();
    });

    it('applies interactive class for clickable variant', () => {
      const { container } = render(<Card variant="clickable">Content</Card>);
      expect(container.querySelector('.card--interactive')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className alongside default classes', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('card--default');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when card is a div', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const { container } = render(<Card as="div">Content</Card>);
      
      const card = container.querySelector('.card');
      if (card) {
        await user.click(card);
      }
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('passes through button props when rendered as button', () => {
      render(
        <Card onClick={() => {}} disabled={true} aria-label="test card">
          Content
        </Card>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'test card');
    });
  });

  describe('Accessibility', () => {
    it('has button type="button" when interactive', () => {
      render(<Card onClick={() => {}}>Content</Card>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('is keyboard accessible when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Header', () => {
    it('renders header with title', () => {
      render(<Card title="Test Title">Content</Card>);
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('renders header with title and subtitle', () => {
      render(<Card title="Test Title" subtitle="Test Subtitle">Content</Card>);
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });

    it('renders header with icon', () => {
      const { container } = render(<Card icon="👥" title="Test Title">Content</Card>);
      expect(container.querySelector('.card__header-icon')).toHaveTextContent('👥');
    });

    it('renders header with action element', () => {
      render(
        <Card title="Test Title" headerAction={<button>Action Button</button>}>
          Content
        </Card>
      );
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('does not render header when no title or icon provided', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('.card__header')).not.toBeInTheDocument();
    });

    it('renders icon without title', () => {
      const { container } = render(<Card icon="👥">Content</Card>);
      expect(container.querySelector('.card__header-icon')).toHaveTextContent('👥');
    });

    it('wraps children in card__body when header is present', () => {
      const { container } = render(<Card title="Test Title">Content</Card>);
      const body = container.querySelector('.card__body');
      expect(body).toBeInTheDocument();
      expect(body).toHaveTextContent('Content');
    });
  });
});
