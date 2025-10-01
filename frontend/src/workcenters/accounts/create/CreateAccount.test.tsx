import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateAccount } from './CreateAccount';
import { accountsApi } from '../../../api';
import type { Account } from '../../../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../api', () => ({
  accountsApi: {
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CreateAccount', () => {
  const buildAccount = (overrides: Partial<Account> = {}): Account => ({
    id: overrides.id ?? 'acc-123',
    displayId: overrides.displayId ?? 'ACC-123',
    name: overrides.name ?? 'New Company',
    industry: overrides.industry ?? 'Manufacturing',
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    accountsApiMock.create.mockResolvedValue(buildAccount());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the create account form', () => {
    renderWithRouter(<CreateAccount />);

    expect(screen.getByText('Create New Account')).toBeDefined();
    expect(screen.getByLabelText(/Account Name/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount />);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Account name is required')).toBeDefined();
    expect(accountsApiMock.create).not.toHaveBeenCalled();
  });

  it('creates account and navigates when valid name is provided', async () => {
    const user = userEvent.setup();
    const createdAccount = buildAccount({ id: 'acc-999', displayId: 'ACC-999', name: 'New Company' });
    accountsApiMock.create.mockResolvedValue(createdAccount);

    renderWithRouter(<CreateAccount />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    const industryInput = screen.getByLabelText(/Industry/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await user.type(nameInput, 'New Company');
    await user.type(industryInput, 'Technology');
    await user.click(submitButton);

    await waitFor(() => {
      expect(accountsApiMock.create).toHaveBeenCalledWith({
        name: 'New Company',
        industry: 'Technology',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/account/acc-999');
  });

  it('trims whitespace from account name', async () => {
    const user = userEvent.setup();
    accountsApiMock.create.mockResolvedValue(
      buildAccount({ id: 'acc-456', name: 'Test Account', displayId: 'ACC-456' })
    );

    renderWithRouter(<CreateAccount />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    const industryInput = screen.getByLabelText(/Industry/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await user.type(nameInput, '  Test Account  ');
    await user.type(industryInput, '  Manufacturing  ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(accountsApiMock.create).toHaveBeenCalledWith({
        name: 'Test Account',
        industry: 'Manufacturing',
      });
    });
  });

  it('clears error when user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount />);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Account name is required')).toBeDefined();

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'A');

    await waitFor(() => {
      expect(screen.queryByText('Account name is required')).toBeNull();
    });
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CreateAccount />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/search');
  });
});
