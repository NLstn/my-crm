import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateContact } from './CreateContact';
import type { Account, Contact } from '../../../types';
import { accountsApi, contactsApi } from '../../../api';

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
    search: vi.fn(),
  },
  contactsApi: {
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const contactsApiMock = vi.mocked(contactsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: overrides.id ?? 'con-1',
  accountId: overrides.accountId ?? 'acc-1',
  fullName: overrides.fullName ?? 'John Doe',
  email: overrides.email ?? 'john.doe@example.com',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: 'acc-1', name: 'Acme Corp' }),
  buildAccount({ id: 'acc-2', name: 'Globex Corporation', industry: 'Technology' }),
  buildAccount({ id: 'acc-3', name: 'Initech', industry: 'Software' }),
];

const renderWithRouter = async () => {
  render(
    <BrowserRouter>
      <CreateContact />
    </BrowserRouter>
  );

  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
  await screen.findByText('Create New Contact');
};

describe('CreateContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    accountsApiMock.search.mockResolvedValue(mockAccounts);
    contactsApiMock.create.mockResolvedValue(
      buildContact({ id: 'con-123', accountId: 'acc-1', fullName: 'Created Contact', email: 'created@example.com' })
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the create contact form', async () => {
    await renderWithRouter();

    expect(screen.getByText('Create New Contact')).toBeDefined();
    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Account/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Contact/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty form', async () => {
    await renderWithRouter();

    const form = document.querySelector('form');
    expect(form).not.toBeNull();

    if (form) {
      fireEvent.submit(form);
    }

    expect(await screen.findByText('Full name is required')).toBeDefined();
    expect(screen.getByText('Email is required')).toBeDefined();
    expect(screen.getByText('Account is required')).toBeDefined();
    expect(contactsApiMock.create).not.toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    await renderWithRouter();

    await user.type(screen.getByLabelText(/Full Name/i), 'Invalid Email User');
    await user.type(screen.getByLabelText(/Email/i), 'invalid-email');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-1');

    const form = document.querySelector('form');
    expect(form).not.toBeNull();

    if (form) {
      fireEvent.submit(form);
    }

    expect(await screen.findByText('Please enter a valid email address')).toBeDefined();
    expect(contactsApiMock.create).not.toHaveBeenCalled();
  });

  it('creates contact and navigates when valid data is provided', async () => {
    const user = userEvent.setup();
    contactsApiMock.create.mockResolvedValue(
      buildContact({ id: 'con-999', accountId: 'acc-1', fullName: 'John Doe', email: 'john.doe@example.com' })
    );

    await renderWithRouter();

    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john.doe@example.com');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-1');
    await user.click(screen.getByRole('button', { name: /Create Contact/i }));

    await waitFor(() => {
      expect(contactsApiMock.create).toHaveBeenCalledWith('acc-1', {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/contact/con-999');
  });

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup();
    contactsApiMock.create.mockResolvedValue(
      buildContact({ id: 'con-456', accountId: 'acc-2', fullName: 'Jane Smith', email: 'jane@example.com' })
    );

    await renderWithRouter();

    await user.type(screen.getByLabelText(/Full Name/i), '  Jane Smith  ');
    await user.type(screen.getByLabelText(/Email/i), '  jane@example.com  ');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-2');
    await user.click(screen.getByRole('button', { name: /Create Contact/i }));

    await waitFor(() => {
      expect(contactsApiMock.create).toHaveBeenCalledWith('acc-2', {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
      });
    });
  });

  it('clears errors when user types', async () => {
    const user = userEvent.setup();
    await renderWithRouter();

    const form = document.querySelector('form');
    expect(form).not.toBeNull();

    if (form) {
      fireEvent.submit(form);
    }

    expect(await screen.findByText('Full name is required')).toBeDefined();

    await user.type(screen.getByLabelText(/Full Name/i), 'A');

    await waitFor(() => {
      expect(screen.queryByText('Full name is required')).toBeNull();
    });
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();
    await renderWithRouter();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/contacts/search');
  });

  it('displays all account options in dropdown', async () => {
    await renderWithRouter();

    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const options = Array.from(accountDropdown.options).map(opt => opt.textContent?.trim());

    expect(options).toContain('Select an account...');
    expect(options).toContain('Acme Corp');
    expect(options).toContain('Globex Corporation');
    expect(options).toContain('Initech');
  });
});
