import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SearchAccounts } from './workcenters/accounts';
import { sampleAccounts } from './pages/Dashboard';
import { Layout } from './components/Layout';

describe('App', () => {
  it('renders the dashboard with CRM heading and panels', () => {
    render(
      <BrowserRouter>
        <Layout>
          <Dashboard />
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /my crm/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /tickets/i })).toBeInTheDocument();
  });

  it('renders search accounts workcenter', () => {
    render(
      <BrowserRouter>
        <Layout>
          <SearchAccounts accounts={sampleAccounts} />
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /search accounts/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by account name/i)).toBeInTheDocument();
  });
});
