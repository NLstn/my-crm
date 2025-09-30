import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

describe('Header', () => {
  it('renders menu button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('renders My CRM button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /my crm/i })).toBeInTheDocument();
    expect(screen.getByText('My CRM')).toBeInTheDocument();
  });

  it('renders profile dropdown with initials', () => {
    render(<Header />);
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    expect(screen.getByText('NL')).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);
    
    await user.click(screen.getByLabelText('Open menu'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls onBackToDashboard when My CRM button is clicked', async () => {
    const user = userEvent.setup();
    const onBackToDashboard = vi.fn();
    render(<Header onBackToDashboard={onBackToDashboard} />);
    
    await user.click(screen.getByRole('button', { name: /my crm/i }));
    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('opens profile dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);
    
    expect(screen.queryByText('Theme')).not.toBeInTheDocument();
    
    await user.click(screen.getByLabelText('User menu'));
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });
});
