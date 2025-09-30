# Search Accounts Workcenter

The **Search Accounts** workcenter provides a searchable interface for finding accounts by name. This is a frontend-only implementation that filters accounts in real-time as the user types.

## Location

- **Path**: `/accounts/search`
- **Files**: `frontend/src/workcenters/accounts/`

## Features

- **Real-time Search**: Filters accounts as you type
- **Case Insensitive**: Search works regardless of letter casing
- **Account Display**: Shows account name and industry
- **Empty States**: Helpful messages when no accounts exist or no results match
- **Responsive**: Works on all screen sizes

## Usage

### Basic Integration

```tsx
import { SearchAccounts } from './workcenters/accounts';
import type { Account } from './App';

const sampleAccounts: Account[] = [
  { id: 'acc-1', name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 'acc-2', name: 'Globex', industry: 'Technology' }
];

function App() {
  return (
    <Layout>
      <SearchAccounts accounts={sampleAccounts} />
    </Layout>
  );
}
```

### With Router (Future)

When you add routing to your application:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchAccounts } from './workcenters/accounts';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/accounts/search" 
            element={<SearchAccounts accounts={accounts} />} 
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

## Props

### SearchAccountsProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accounts` | `Account[]` | Yes | Array of account objects to search through |

### Account Type

```typescript
interface Account {
  id: string;
  name: string;
  industry: string;
}
```

## Search Behavior

The search field filters accounts by:
- Account name (partial match)
- Case insensitive matching
- Real-time updates as you type

### Examples

- Searching for "acme" will match "Acme Corp"
- Searching for "CORP" will match "Acme Corp" and "Umbrella Corporation"
- Empty search shows all accounts

## Styling

The component uses the theme system from `src/theme.css`:

- **Background**: `--color-surface` for cards
- **Text**: `--color-text-primary`, `--color-text-secondary`
- **Borders**: `--color-border` with hover states
- **Spacing**: Theme spacing variables
- **Shadows**: `--shadow-sm` and `--shadow-md`

### Custom Styling

To customize the appearance, override the CSS classes:

```css
.search-accounts__account-card {
  /* Your custom styles */
}
```

## Future Enhancements

Planned improvements for this workcenter:

- [ ] Add more search filters (industry, date created, etc.)
- [ ] Implement pagination for large account lists
- [ ] Add sorting options (name, industry, date)
- [ ] Click on account card to view details
- [ ] Export search results
- [ ] Save search filters
- [ ] Connect to backend API for server-side search
- [ ] Add keyboard shortcuts for navigation

## Testing

The component has comprehensive test coverage. Run tests with:

```bash
npm test -- SearchAccounts.test.tsx
```

Tests cover:
- Rendering
- Search filtering
- Case insensitivity
- Empty states
- User interactions

## Accessibility

The workcenter follows accessibility best practices:

- Proper label association with `htmlFor`
- Semantic HTML structure
- Keyboard navigation support
- Clear empty states with helpful messages
- ARIA attributes where needed

## Integration Example

Here's a complete example showing how to integrate the Search Accounts workcenter into your app:

```tsx
// App.tsx
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SearchAccounts } from './workcenters/accounts';
import type { Account } from './App';

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // In the future, fetch from API
    // For now, use sample data
    setAccounts([
      { id: 'acc-1', name: 'Acme Corp', industry: 'Manufacturing' },
      { id: 'acc-2', name: 'Globex', industry: 'Technology' },
      { id: 'acc-3', name: 'Initech', industry: 'Software' },
    ]);
  }, []);

  return (
    <Layout>
      <SearchAccounts accounts={accounts} />
    </Layout>
  );
}

export default App;
```

## Component Structure

```
workcenters/accounts/
├── SearchAccounts.tsx       # Main component
├── SearchAccounts.css       # Styles
├── SearchAccounts.test.tsx  # Tests
├── index.ts                 # Barrel export
└── README.md                # This file
```

## Notes

- This is a **frontend-only** implementation using local filtering
- Search happens in the browser on the provided `accounts` array
- For large datasets (1000+ accounts), consider server-side search
- The workcenter is not added to the sidebar navigation yet (as requested)
