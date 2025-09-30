import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { Sidebar, WorkCenter } from './Sidebar';

const mockWorkCenters: WorkCenter[] = [
  { id: '1', name: 'Accounts', icon: '👥', path: '/accounts' },
  { id: '2', name: 'Contacts', icon: '📇', path: '/contacts' },
];

const mockWorkCentersWithSubItems: WorkCenter[] = [
  { 
    id: '1', 
    name: 'Accounts', 
    icon: '👥', 
    path: '/accounts',
    defaultPath: '/accounts/search',
    subItems: [
      { id: '1-1', name: 'Search Accounts', path: '/accounts/search' },
      { id: '1-2', name: 'Create Account', path: '/accounts/create' },
    ]
  },
  { id: '2', name: 'Contacts', icon: '📇', path: '/contacts' },
];

describe('Sidebar', () => {
  it('renders sidebar when open', () => {
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    expect(screen.getByText('Work Centers')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('does not show backdrop when closed', () => {
    const { container } = render(
      <Sidebar
        isOpen={false}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    const backdrop = container.querySelector('.sidebar-backdrop');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('shows backdrop when open', () => {
    const { container } = render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    const backdrop = container.querySelector('.sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Sidebar
        isOpen={true}
        onClose={onClose}
        workCenters={mockWorkCenters}
      />
    );

    const closeButton = screen.getByLabelText('Close sidebar');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <Sidebar
        isOpen={true}
        onClose={onClose}
        workCenters={mockWorkCenters}
      />
    );

    const backdrop = container.querySelector('.sidebar-backdrop');
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigate and onClose when a work center is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(
      <Sidebar
        isOpen={true}
        onClose={onClose}
        workCenters={mockWorkCenters}
        onNavigate={onNavigate}
      />
    );

    const accountsLink = screen.getByText('Accounts');
    await user.click(accountsLink);

    expect(onNavigate).toHaveBeenCalledWith(mockWorkCenters[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders work center icons when provided', () => {
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    expect(screen.getByText('👥')).toBeInTheDocument();
    expect(screen.getByText('📇')).toBeInTheDocument();
  });

  it('applies correct CSS classes when open', () => {
    const { container } = render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toHaveClass('sidebar--open');
  });

  it('does not apply open class when closed', () => {
    const { container } = render(
      <Sidebar
        isOpen={false}
        onClose={vi.fn()}
        workCenters={mockWorkCenters}
      />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('sidebar--open');
  });

  describe('nested workcenters', () => {
    it('renders parent workcenter with expand button when it has subitems', () => {
      render(
        <Sidebar
          isOpen={true}
          onClose={vi.fn()}
          workCenters={mockWorkCentersWithSubItems}
        />
      );

      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByLabelText('Expand Accounts')).toBeInTheDocument();
    });

    it('does not show subitems initially', () => {
      render(
        <Sidebar
          isOpen={true}
          onClose={vi.fn()}
          workCenters={mockWorkCentersWithSubItems}
        />
      );

      expect(screen.queryByText('Search Accounts')).not.toBeInTheDocument();
      expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
    });

    it('shows subitems when expand button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Sidebar
          isOpen={true}
          onClose={vi.fn()}
          workCenters={mockWorkCentersWithSubItems}
        />
      );

      const expandButton = screen.getByLabelText('Expand Accounts');
      await act(async () => {
        await user.click(expandButton);
      });

      expect(screen.getByText('Search Accounts')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('hides subitems when collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Sidebar
          isOpen={true}
          onClose={vi.fn()}
          workCenters={mockWorkCentersWithSubItems}
        />
      );

      const expandButton = screen.getByLabelText('Expand Accounts');
      await act(async () => {
        await user.click(expandButton);
      });
      
      expect(screen.getByText('Search Accounts')).toBeInTheDocument();

      const collapseButton = screen.getByLabelText('Collapse Accounts');
      await act(async () => {
        await user.click(collapseButton);
      });

      expect(screen.queryByText('Search Accounts')).not.toBeInTheDocument();
    });

    it('navigates to defaultPath when parent with subitems is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      const onClose = vi.fn();

      render(
        <Sidebar
          isOpen={true}
          onClose={onClose}
          workCenters={mockWorkCentersWithSubItems}
          onNavigate={onNavigate}
        />
      );

      const accountsLink = screen.getByText('Accounts');
      await user.click(accountsLink);

      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/accounts/search' })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to subitem path when subitem is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      const onClose = vi.fn();

      render(
        <Sidebar
          isOpen={true}
          onClose={onClose}
          workCenters={mockWorkCentersWithSubItems}
          onNavigate={onNavigate}
        />
      );

      // First expand the parent
      const expandButton = screen.getByLabelText('Expand Accounts');
      await act(async () => {
        await user.click(expandButton);
      });

      // Then click the subitem
      const searchAccountsLink = screen.getByText('Search Accounts');
      await act(async () => {
        await user.click(searchAccountsLink);
      });

      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ 
          id: '1-1',
          name: 'Search Accounts',
          path: '/accounts/search' 
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not show expand button for workcenters without subitems', () => {
      render(
        <Sidebar
          isOpen={true}
          onClose={vi.fn()}
          workCenters={mockWorkCentersWithSubItems}
        />
      );

      expect(screen.queryByLabelText('Expand Contacts')).not.toBeInTheDocument();
    });
  });
});
