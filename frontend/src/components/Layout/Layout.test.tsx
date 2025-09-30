import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header component', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    expect(screen.getByRole('button', { name: /my crm/i })).toBeInTheDocument();
  });

  it('renders main content area', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    expect(container.querySelector('.layout__content')).toBeInTheDocument();
  });
});
