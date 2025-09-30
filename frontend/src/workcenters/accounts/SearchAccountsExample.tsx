// Example of how to use the SearchAccounts workcenter
// This file demonstrates integration - copy this code to App.tsx when ready

import { Layout } from '../../components/Layout';
import { SearchAccounts } from './SearchAccounts';
import type { Account } from '../../App';

const sampleAccounts: Account[] = [
  { id: 'acc-1', name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 'acc-2', name: 'Globex Corporation', industry: 'Technology' },
  { id: 'acc-3', name: 'Initech', industry: 'Software' },
  { id: 'acc-4', name: 'Umbrella Corporation', industry: 'Pharmaceuticals' },
  { id: 'acc-5', name: 'Stark Industries', industry: 'Technology' },
  { id: 'acc-6', name: 'Wayne Enterprises', industry: 'Conglomerate' },
  { id: 'acc-7', name: 'Oscorp', industry: 'Research' },
  { id: 'acc-8', name: 'Cyberdyne Systems', industry: 'Robotics' },
];

function SearchAccountsExample() {
  return (
    <Layout>
      <SearchAccounts accounts={sampleAccounts} />
    </Layout>
  );
}

export default SearchAccountsExample;
