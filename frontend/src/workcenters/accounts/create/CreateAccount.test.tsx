import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateAccount } from './CreateAccount';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CreateAccount', () => {
  const mockOnCreateAccount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create account form', () => {
    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    expect(screen.getByText('Create New Account')).toBeDefined();
    expect(screen.getByLabelText(/Account Name/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    await act(async () => {
      await user.click(submitButton);
    });

    expect(screen.getByText('Account name is required')).toBeDefined();
    expect(mockOnCreateAccount).not.toHaveBeenCalled();
  });

  it('creates account and navigates when valid name is provided', async () => {
    const user = userEvent.setup();
    mockOnCreateAccount.mockReturnValue(123);

    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await act(async () => {
      await user.type(nameInput, 'New Company');
      await user.click(submitButton);
    });

    expect(mockOnCreateAccount).toHaveBeenCalledWith('New Company');
    expect(mockNavigate).toHaveBeenCalledWith('/account/123');
  });

  it('trims whitespace from account name', async () => {
    const user = userEvent.setup();
    mockOnCreateAccount.mockReturnValue(456);

    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await act(async () => {
      await user.type(nameInput, '  Test Account  ');
      await user.click(submitButton);
    });

    expect(mockOnCreateAccount).toHaveBeenCalledWith('Test Account');
  });

  it('clears error when user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    await act(async () => {
      await user.click(submitButton);
    });

    expect(screen.getByText('Account name is required')).toBeDefined();

    const nameInput = screen.getByLabelText(/Account Name/i);
    await act(async () => {
      await user.type(nameInput, 'A');
    });

    expect(screen.queryByText('Account name is required')).toBeNull();
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount onCreateAccount={mockOnCreateAccount} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/search');
  });
});
