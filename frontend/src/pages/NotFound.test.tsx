import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from './NotFound';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFound', () => {
  it('renders the 404 error message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /404 - page not found/i })).toBeInTheDocument();
    expect(screen.getByText(/the page you're looking for doesn't exist or has been moved/i)).toBeInTheDocument();
  });

  it('renders a button to navigate back to dashboard', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it('navigates to dashboard when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /back to dashboard/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
