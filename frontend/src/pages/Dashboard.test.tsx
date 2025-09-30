import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('renders the CRM heading and description', () => {
    render(<Dashboard />);

    expect(screen.getByRole('heading', { level: 1, name: /my crm/i })).toBeInTheDocument();
    expect(screen.getByText(/track accounts, their contacts, and support tickets/i)).toBeInTheDocument();
  });

  it('renders all panels', () => {
    render(<Dashboard />);

    expect(screen.getByRole('heading', { level: 2, name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /tickets/i })).toBeInTheDocument();
  });

  it('renders sample accounts', () => {
    render(<Dashboard />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });
});
