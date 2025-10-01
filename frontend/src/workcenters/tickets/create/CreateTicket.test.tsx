import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateTicket } from './CreateTicket';
import { accountsApi, ticketsApi } from '../../../api';
import type { Account, Ticket } from '../../../types';

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
  ticketsApi: {
    create: vi.fn(),
    getByAccount: vi.fn(),
  },
  contactsApi: {
    getByAccount: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const ticketsApiMock = vi.mocked(ticketsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: 'acc-1', displayId: 'ACC-1', name: 'Acme Corp' }),
  buildAccount({ id: 'acc-2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
  buildAccount({ id: 'acc-3', displayId: 'ACC-3', name: 'Initech', industry: 'Software' }),
];

const renderWithRouter = async () => {
  render(
    <BrowserRouter>
      <CreateTicket />
    </BrowserRouter>
  );

  await screen.findByText('Create New Ticket');
};

describe('CreateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountsApiMock.search.mockResolvedValue(mockAccounts);
    ticketsApiMock.create.mockResolvedValue({
      id: 'tic-123',
      accountId: 'acc-1',
      title: 'Created ticket',
      status: 'open',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as Ticket);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the create ticket form', async () => {
    await renderWithRouter();

    expect(screen.getByText('Create New Ticket')).toBeDefined();
    expect(screen.getByLabelText(/Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Account/i)).toBeDefined();
    expect(screen.getByLabelText(/Status/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Ticket/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty form', async () => {
    await renderWithRouter();

    const form = document.querySelector('form');
    expect(form).not.toBeNull();

    if (form) {
      fireEvent.submit(form);
    }

    expect(await screen.findByText('Title is required')).toBeDefined();
    expect(await screen.findByText('Account is required')).toBeDefined();
    expect(ticketsApiMock.create).not.toHaveBeenCalled();
  });

  it('creates ticket and navigates when valid data is provided', async () => {
    const user = userEvent.setup();
    ticketsApiMock.create.mockResolvedValue({
      id: 'tic-123',
      accountId: 'acc-1',
      title: 'Need help with setup',
      status: 'open',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as Ticket);

    await renderWithRouter();

    await user.type(screen.getByLabelText(/Title/i), 'Need help with setup');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-1');
    await user.selectOptions(screen.getByLabelText(/Status/i), 'open');
    await user.click(screen.getByRole('button', { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(ticketsApiMock.create).toHaveBeenCalledWith('acc-1', {
        title: 'Need help with setup',
        status: 'open',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/ticket/tic-123');
    });
  });

  it('trims whitespace from title', async () => {
    const user = userEvent.setup();
    ticketsApiMock.create.mockResolvedValue({
      id: 'tic-456',
      accountId: 'acc-2',
      title: 'Urgent issue',
      status: 'open',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as Ticket);

    await renderWithRouter();

    await user.type(screen.getByLabelText(/Title/i), '  Urgent issue  ');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-2');
    await user.click(screen.getByRole('button', { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(ticketsApiMock.create).toHaveBeenCalledWith('acc-2', {
        title: 'Urgent issue',
        status: 'open',
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

    expect(await screen.findByText('Title is required')).toBeDefined();

    await user.type(screen.getByLabelText(/Title/i), 'A');

    await waitFor(() => {
      expect(screen.queryByText('Title is required')).toBeNull();
    });
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();

    await renderWithRouter();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/search');
  });

  it('displays all account options in dropdown', async () => {
    await renderWithRouter();

    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const optionTexts = Array.from(accountDropdown.options).map(opt => opt.textContent);

    expect(optionTexts).toContain('Select an account...');
    expect(optionTexts).toContain('Acme Corp');
    expect(optionTexts).toContain('Globex Corporation');
    expect(optionTexts).toContain('Initech');
  });

  it('displays all status options in dropdown', async () => {
    await renderWithRouter();

    const statusDropdown = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const optionTexts = Array.from(statusDropdown.options).map(opt => opt.textContent?.trim());

    expect(optionTexts).toContain('Open');
    expect(optionTexts).toContain('In Progress');
    expect(optionTexts).toContain('Closed');
  });

  it('allows selecting different statuses', async () => {
    const user = userEvent.setup();
    ticketsApiMock.create.mockResolvedValue({
      id: 'tic-789',
      accountId: 'acc-3',
      title: 'Follow up call',
      status: 'in_progress',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as Ticket);

    await renderWithRouter();

    await user.type(screen.getByLabelText(/Title/i), 'Follow up call');
    await user.selectOptions(screen.getByLabelText(/Account/i), 'acc-3');
    await user.selectOptions(screen.getByLabelText(/Status/i), 'in_progress');
    await user.click(screen.getByRole('button', { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(ticketsApiMock.create).toHaveBeenCalledWith('acc-3', {
        title: 'Follow up call',
        status: 'in_progress',
      });
    });
  });
});
