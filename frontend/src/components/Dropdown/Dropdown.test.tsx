import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  it('renders trigger element', () => {
    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <div>Content</div>
      </Dropdown>
    );
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeInTheDocument();
  });

  it('shows content when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <div>Dropdown Content</div>
      </Dropdown>
    );

    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
    
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    });
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();
  });

  it('hides content when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <div>Dropdown Content</div>
      </Dropdown>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    });
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();
    
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    });
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Dropdown trigger={<button>Open Menu</button>}>
          <div>Dropdown Content</div>
        </Dropdown>
        <button>Outside Button</button>
      </div>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    });
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();
    
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Outside Button' }));
    });
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });

  it('closes when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <div>Dropdown Content</div>
      </Dropdown>
    );

    const trigger = screen.getByRole('button', { name: 'Open Menu' });
    await act(async () => {
      await user.click(trigger);
    });
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();
    
    await act(async () => {
      await user.keyboard('{Escape}');
    });
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });
});
