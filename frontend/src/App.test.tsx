import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the CRM heading and panels', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /my crm/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /tickets/i })).toBeInTheDocument();
  });
});
