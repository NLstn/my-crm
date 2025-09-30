# Routing Configuration

This document describes the routing setup for the My CRM application.

## Overview

The application now uses **React Router v6** for client-side routing. The routing is configured in `src/App.tsx` with the following structure:

```
/                    → Dashboard (home page)
/accounts/search     → Search Accounts workcenter
/account/:id         → Display Account workcenter (where :id is a numeric account ID)
```

## File Structure

```
frontend/src/
├── App.tsx                      # Main app with routing setup
├── App.test.tsx                 # App tests
├── pages/
│   ├── Dashboard.tsx            # Dashboard page (moved from App.tsx)
│   └── Dashboard.test.tsx       # Dashboard tests
└── workcenters/
    └── accounts/
        ├── SearchAccounts.tsx   # Search Accounts workcenter
        ├── SearchAccounts.css   # Styles
        ├── SearchAccounts.test.tsx # Tests
        ├── index.ts             # Barrel export
        └── README.md            # Documentation
```

## Routes

### Dashboard - `/`

The main dashboard showing accounts, contacts, and tickets in a columnar layout.

**Component**: `Dashboard` from `src/pages/Dashboard.tsx`

### Search Accounts - `/accounts/search`

The search accounts workcenter for filtering and finding accounts by name. Clicking an account card navigates to the account detail view.

**Component**: `SearchAccounts` from `src/workcenters/accounts`

### Display Account - `/account/:id`

The display account workcenter shows detailed information about a specific account, including its contacts and tickets. The `:id` parameter is a numeric account ID (e.g., `/account/1`, `/account/2`).

**Component**: `DisplayAccount` from `src/workcenters/accounts`

**Features**:
- Account details with numeric ID display
- Summary statistics (contacts, tickets, open tickets)
- List of contacts for the account
- List of tickets with status badges
- Back button to return to search
- Error handling for non-existent accounts

## Navigation

### Programmatic Navigation

The app uses React Router's `useNavigate` hook for programmatic navigation:

```tsx
const navigate = useNavigate();

// Navigate to dashboard
navigate('/');

// Navigate to search accounts
navigate('/accounts/search');
```

### Navigation from Layout

The Layout component receives navigation callbacks:

- `onBackToDashboard`: Navigates to `/` when the "My CRM" button is clicked
- `onNavigate`: Navigates to workcenter paths when sidebar items are clicked

Example:
```tsx
const handleBackToDashboard = () => {
  navigate('/');
};

const handleNavigate = (workCenter: { path: string }) => {
  navigate(workCenter.path);
};

<Layout 
  onBackToDashboard={handleBackToDashboard}
  onNavigate={handleNavigate}
>
  <Routes>
    {/* routes */}
  </Routes>
</Layout>
```

## Adding New Routes

To add a new route:

1. **Create the page/workcenter component** in the appropriate directory
2. **Import it in App.tsx**:
   ```tsx
   import { MyNewPage } from './pages/MyNewPage';
   ```
3. **Add the route**:
   ```tsx
   <Routes>
     <Route path="/" element={<Dashboard />} />
     <Route path="/accounts/search" element={<SearchAccounts accounts={sampleAccounts} />} />
     <Route path="/my-new-page" element={<MyNewPage />} />
   </Routes>
   ```

## Sidebar Navigation

The sidebar navigation is handled by the `Sidebar` component. Workcenters can be added to the sidebar by updating the `defaultWorkCenters` array in `Layout.tsx` or by passing custom workcenters as props:

```tsx
const customWorkCenters = [
  { id: 'accounts', name: 'Accounts', icon: '👥', path: '/accounts' },
  { id: 'search', name: 'Search', icon: '🔍', path: '/accounts/search' },
];

<Layout workCenters={customWorkCenters} onNavigate={handleNavigate}>
  {/* content */}
</Layout>
```

## Testing Routes

When testing components that use routing, wrap them in a `BrowserRouter`:

```tsx
import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

it('renders the page', () => {
  render(
    <BrowserRouter>
      <Layout>
        <MyPage />
      </Layout>
    </BrowserRouter>
  );
  
  // assertions...
});
```

See `src/App.test.tsx` for examples.

## URL Parameters

The application uses dynamic route parameters for viewing specific resources.

### Example: Display Account

```tsx
<Route path="/account/:id" element={<DisplayAccount />} />
```

Access the parameter in the component:
```tsx
import { useParams } from 'react-router-dom';

function DisplayAccount() {
  const { id } = useParams<{ id: string }>();
  const accountId = id ? parseInt(id, 10) : null;
  // Use accountId to find and display account details
}
```

### Numeric IDs in URLs

Accounts use numeric IDs in URLs for clarity and simplicity:
- `/account/1` instead of `/account/acc-1`
- IDs are displayed in the UI: "ID: 1"
- Related entities reference accounts using string IDs internally

## Link Components (Future)

For declarative navigation, use React Router's `Link` component:

```tsx
import { Link } from 'react-router-dom';

<Link to="/accounts/search">Search Accounts</Link>
```

## Current Workcenters

### Search Accounts

The Search Accounts workcenter is accessible at `/accounts/search`.

**Features**:
- Real-time search filtering by account name
- Case-insensitive search
- Results counter
- Clickable account cards with IDs
- Navigation to account details
- Empty states
- Responsive design

**Usage**:
1. Start the frontend: `npm run dev`
2. Navigate to http://localhost:5173/accounts/search
3. Click any account card to view its details

### Display Account

The Display Account workcenter shows details for a specific account at `/account/:id`.

**Features**:
- Account information with numeric ID display
- Summary statistics (contacts, tickets, open tickets)
- Contacts list with email addresses
- Tickets list with color-coded status badges
- Back button to return to search
- Error state for non-existent accounts
- Empty states for accounts with no contacts/tickets
- Responsive design

**Usage**:
1. Navigate from Search Accounts by clicking an account card
2. Or directly visit http://localhost:5173/account/1 (or any valid account ID)
3. Click "Back to Search" to return to the search page

## Dependencies

- `react-router-dom`: ^6.x (installed)
- `@types/react-router-dom`: ^6.x (installed as dev dependency)

## Notes

- The routing is configured for client-side navigation (SPA)
- All routes are defined in a single location (`App.tsx`) for clarity
- The dashboard data is currently static (sample data) but ready to be connected to API
- Search Accounts uses frontend-only filtering; backend search will be added later
