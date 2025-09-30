import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateTicket, Account } from './CreateTicket';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex Corporation' },
  { id: 3, name: 'Initech' },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CreateTicket', () => {
  const mockOnCreateTicket = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create ticket form', () => {
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    expect(screen.getByText('Create New Ticket')).toBeDefined();
    expect(screen.getByLabelText(/Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Account/i)).toBeDefined();
    expect(screen.getByLabelText(/Status/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Ticket/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const form = screen.getByRole('button', { name: /Create Ticket/i }).closest('form');
    await act(async () => {
      // Submit form programmatically to bypass HTML5 validation
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(event);
    });

    expect(screen.getByText('Title is required')).toBeDefined();
    expect(screen.getByText('Account is required')).toBeDefined();
    expect(mockOnCreateTicket).not.toHaveBeenCalled();
  });

  it('creates ticket and navigates when valid data is provided', async () => {
    const user = userEvent.setup();
    mockOnCreateTicket.mockReturnValue('tic-123');

    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const titleInput = screen.getByLabelText(/Title/i);
    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const statusDropdown = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Create Ticket/i });

    await act(async () => {
      await user.type(titleInput, 'Need help with setup');
      await user.selectOptions(accountDropdown, '1');
      await user.selectOptions(statusDropdown, 'open');
      await user.click(submitButton);
    });

    expect(mockOnCreateTicket).toHaveBeenCalledWith('Need help with setup', '1', 'open');
    expect(mockNavigate).toHaveBeenCalledWith('/ticket/tic-123');
  });

  it('trims whitespace from title', async () => {
    const user = userEvent.setup();
    mockOnCreateTicket.mockReturnValue('tic-456');

    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const titleInput = screen.getByLabelText(/Title/i);
    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Create Ticket/i });

    await act(async () => {
      await user.type(titleInput, '  Urgent issue  ');
      await user.selectOptions(accountDropdown, '2');
      await user.click(submitButton);
    });

    expect(mockOnCreateTicket).toHaveBeenCalledWith('Urgent issue', '2', 'open');
  });

  it('clears errors when user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const form = screen.getByRole('button', { name: /Create Ticket/i }).closest('form');
    await act(async () => {
      // Submit form programmatically to bypass HTML5 validation
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(event);
    });

    expect(screen.getByText('Title is required')).toBeDefined();

    const titleInput = screen.getByLabelText(/Title/i);
    await act(async () => {
      await user.type(titleInput, 'A');
    });

    expect(screen.queryByText('Title is required')).toBeNull();
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/search');
  });

  it('displays all account options in dropdown', () => {
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const options = Array.from(accountDropdown.options).map(opt => opt.text);
    
    expect(options).toContain('Acme Corp');
    expect(options).toContain('Globex Corporation');
    expect(options).toContain('Initech');
    expect(options).toContain('Select an account...');
  });

  it('displays all status options in dropdown', () => {
    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const statusDropdown = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const options = Array.from(statusDropdown.options).map(opt => opt.text);
    
    expect(options).toContain('Open');
    expect(options).toContain('In Progress');
    expect(options).toContain('Closed');
  });

  it('allows selecting different statuses', async () => {
    const user = userEvent.setup();
    mockOnCreateTicket.mockReturnValue('tic-789');

    renderWithRouter(
      <CreateTicket 
        accounts={mockAccounts} 
        onCreateTicket={mockOnCreateTicket} 
      />
    );

    const titleInput = screen.getByLabelText(/Title/i);
    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const statusDropdown = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Create Ticket/i });

    await act(async () => {
      await user.type(titleInput, 'Follow up call');
      await user.selectOptions(accountDropdown, '3');
      await user.selectOptions(statusDropdown, 'in_progress');
      await user.click(submitButton);
    });

    expect(mockOnCreateTicket).toHaveBeenCalledWith('Follow up call', '3', 'in_progress');
  });
});
