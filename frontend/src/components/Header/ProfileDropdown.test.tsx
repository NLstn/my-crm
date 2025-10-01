import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ProfileDropdown } from './ProfileDropdown';

describe('ProfileDropdown', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders with user initials', () => {
    render(<ProfileDropdown initials="AB" />);
    expect(screen.getAllByText('AB')[0]).toBeInTheDocument();
  });

  it('shows default initials when not provided', () => {
    render(<ProfileDropdown />);
    expect(screen.getAllByText('NL')[0]).toBeInTheDocument();
  });

  it('shows theme button when dropdown is opened', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown />);
    
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('starts with dark theme by default', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown />);
    
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme when theme button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown />);
    
    // Open dropdown
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    // Verify initial dark theme
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
    
    // Click theme button
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /theme/i }));
    });
    
    // Verify theme changed to light
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('crm-theme')).toBe('light');
  });

  it('persists theme preference in localStorage', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown />);
    
    // Open dropdown and toggle theme
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /theme/i }));
    });
    
    expect(localStorage.getItem('crm-theme')).toBe('light');
  });

  it('loads theme from localStorage on mount', async () => {
    localStorage.setItem('crm-theme', 'light');
    const user = userEvent.setup();
    
    render(<ProfileDropdown />);
    
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('can toggle theme multiple times', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown />);
    
    await act(async () => {
      await user.click(screen.getByLabelText('User menu'));
    });
    
    // Toggle to light
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /theme/i }));
    });
    expect(screen.getByText('Light')).toBeInTheDocument();
    
    // Toggle back to dark
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /theme/i }));
    });
    expect(screen.getByText('Dark')).toBeInTheDocument();
    
    // Toggle to light again
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /theme/i }));
    });
    expect(screen.getByText('Light')).toBeInTheDocument();
  });
});
