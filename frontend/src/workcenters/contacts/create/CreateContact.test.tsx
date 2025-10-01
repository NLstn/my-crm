import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CreateContact, Account } from './CreateContact';

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

describe('CreateContact', () => {
  const mockOnCreateContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create contact form', () => {
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    expect(screen.getByText('Create New Contact')).toBeDefined();
    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Account/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Contact/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });

  it('shows error when submitting empty form', async () => {
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const form = screen.getByRole('button', { name: /Create Contact/i }).closest('form');
    await act(async () => {
      // Submit form programmatically to bypass HTML5 validation
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(event);
    });

    expect(screen.getByText('Full name is required')).toBeDefined();
    expect(screen.getByText('Email is required')).toBeDefined();
    expect(screen.getByText('Account is required')).toBeDefined();
    expect(mockOnCreateContact).not.toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const form = screen.getByRole('button', { name: /Create Contact/i }).closest('form');

    await act(async () => {
      await user.type(emailInput, 'invalid-email');
      // Submit form programmatically to bypass HTML5 validation
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(event);
    });

    expect(screen.getByText('Please enter a valid email address')).toBeDefined();
    expect(mockOnCreateContact).not.toHaveBeenCalled();
  });

  it('creates contact and navigates when valid data is provided', async () => {
    const user = userEvent.setup();
    mockOnCreateContact.mockReturnValue(123);

    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Create Contact/i });

    await act(async () => {
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john.doe@example.com');
      await user.selectOptions(accountDropdown, '1');
      await user.click(submitButton);
    });

    expect(mockOnCreateContact).toHaveBeenCalledWith('John Doe', 'john.doe@example.com', '1');
    expect(mockNavigate).toHaveBeenCalledWith('/contact/123');
  });

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup();
    mockOnCreateContact.mockReturnValue(456);

    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Create Contact/i });

    await act(async () => {
      await user.type(nameInput, '  Jane Smith  ');
      await user.type(emailInput, '  jane@example.com  ');
      await user.selectOptions(accountDropdown, '2');
      await user.click(submitButton);
    });

    expect(mockOnCreateContact).toHaveBeenCalledWith('Jane Smith', 'jane@example.com', '2');
  });

  it('clears errors when user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const form = screen.getByRole('button', { name: /Create Contact/i }).closest('form');
    await act(async () => {
      // Submit form programmatically to bypass HTML5 validation
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(event);
    });

    expect(screen.getByText('Full name is required')).toBeDefined();

    const nameInput = screen.getByLabelText(/Full Name/i);
    await act(async () => {
      await user.type(nameInput, 'A');
    });

    expect(screen.queryByText('Full name is required')).toBeNull();
  });

  it('navigates to search when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/contacts/search');
  });

  it('displays all account options in dropdown', () => {
    renderWithRouter(
      <CreateContact 
        accounts={mockAccounts} 
        onCreateContact={mockOnCreateContact} 
      />
    );

    const accountDropdown = screen.getByLabelText(/Account/i) as HTMLSelectElement;
    const options = Array.from(accountDropdown.options).map(opt => opt.text);
    
    expect(options).toContain('Acme Corp');
    expect(options).toContain('Globex Corporation');
    expect(options).toContain('Initech');
    expect(options).toContain('Select an account...');
  });
});
