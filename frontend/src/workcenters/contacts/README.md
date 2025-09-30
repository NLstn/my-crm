# Contacts Workcenters

This directory contains workcenters related to contact management in the My CRM application.

## Workcenters

### SearchContacts

The **Search Contacts** workcenter provides a searchable interface for finding contacts by name or email.

- **Path**: `/contacts/search`
- **Features**: Real-time search filtering by name and email, clickable contact cards, display of associated account

### DisplayContact

The **Display Contact** workcenter shows detailed information about a specific contact.

- **Path**: `/contact/:id` (where `:id` is a numeric contact ID)
- **Features**: Contact details, associated account information, account tickets list, summary statistics

### CreateContact

The **Create Contact** workcenter provides a form to create new contacts.

- **Path**: `/contacts/create`
- **Features**: Form validation, account selection, email validation, navigation to newly created contact

## Location

- **Files**: `frontend/src/workcenters/contacts/`

## Features

- **Real-time Search**: Filters contacts as you type
- **Multi-field Search**: Search by name and/or email simultaneously
- **Case Insensitive**: Search works regardless of letter casing
- **Contact Display**: Shows contact name, email, and associated account
- **Account Association**: Each contact is linked to an account
- **Form Validation**: Validates required fields and email format
- **Empty States**: Helpful messages when no contacts exist or no results match
- **Responsive**: Works on all screen sizes

## Usage

### Basic Integration

```tsx
import { SearchContacts } from './workcenters/contacts';
import type { Contact, Account } from './workcenters/contacts';

const sampleContacts: Contact[] = [
  { id: 1, accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' },
  { id: 2, accountId: '1', fullName: 'Jane Smith', email: 'jane.smith@acme.com' }
];

const sampleAccounts: Account[] = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex' }
];

function App() {
  return (
    <Layout>
      <SearchContacts contacts={sampleContacts} accounts={sampleAccounts} />
    </Layout>
  );
}
```

### With Router

When you add routing to your application:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchContacts, DisplayContact, CreateContact } from './workcenters/contacts';

function App() {
  const handleCreateContact = (fullName: string, email: string, accountId: string) => {
    // Create contact logic
    return newContactId;
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/contacts/search" 
            element={<SearchContacts contacts={contacts} accounts={accounts} />} 
          />
          <Route 
            path="/contact/:id" 
            element={<DisplayContact contacts={contacts} accounts={accounts} tickets={tickets} />} 
          />
          <Route 
            path="/contacts/create" 
            element={<CreateContact accounts={accounts} onCreateContact={handleCreateContact} />} 
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

## Props

### SearchContactsProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contacts` | `Contact[]` | Yes | Array of contact objects to search through |
| `accounts` | `Account[]` | Yes | Array of account objects for displaying account names |

### DisplayContactProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contacts` | `Contact[]` | Yes | Array of contact objects |
| `accounts` | `Account[]` | Yes | Array of account objects |
| `tickets` | `Ticket[]` | Yes | Array of ticket objects |

### CreateContactProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accounts` | `Account[]` | Yes | Array of account objects for selection |
| `onCreateContact` | `(fullName: string, email: string, accountId: string) => number` | Yes | Callback function that creates a contact and returns its ID |

### Type Definitions

```typescript
interface Contact {
  id: number;  // Numeric ID for display and routing
  accountId: string;  // String representation of account's numeric ID
  fullName: string;
  email: string;
}

interface Account {
  id: number;
  name: string;
  industry?: string;  // Optional, used in DisplayContact
}

interface Ticket {
  id: string;
  accountId: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
}
```

## Search Behavior

The search fields filter contacts by:
- Contact name (partial match)
- Email address (partial match)
- Case insensitive matching
- Real-time updates as you type
- Both filters can be used simultaneously

### Examples

- Searching for "john" in name will match "John Doe" and "Bob Johnson"
- Searching for "acme" in email will match all contacts with @acme.com
- Using both filters narrows results to contacts matching both criteria

## Styling

The components use the theme system from `src/theme.css`:

- **Background**: `--color-surface` for cards
- **Text**: `--color-text-primary`, `--color-text-secondary`
- **Borders**: `--color-border` with hover states
- **Spacing**: Theme spacing variables
- **Shadows**: `--shadow-sm` and `--shadow-md`
- **Status Colors**: For ticket status badges

### Custom Styling

To customize the appearance, override the CSS classes:

```css
.search-contacts__contact-card {
  /* Your custom styles */
}

.display-contact__account-card {
  /* Your custom styles */
}
```

## Data Model

### Contact ID Format

Contacts use **numeric IDs** (e.g., `1`, `2`, `3`) for:
- Display in the UI
- URL routing (`/contact/1`)
- Cleaner, more readable identifiers

Contacts reference accounts using **string IDs** in their `accountId` field (e.g., `'1'`, `'2'`) for consistency with backend integration.

## Form Validation

The CreateContact workcenter includes:
- **Required fields**: Full name, email, and account must be provided
- **Email validation**: Checks for valid email format
- **Whitespace trimming**: Removes leading/trailing spaces
- **Real-time error clearing**: Errors disappear as user corrects them
- **Visual feedback**: Error messages and field highlighting

## Navigation Flow

1. **Search → Display**: Click any contact card to view details
2. **Search → Create**: Click "Create New Contact" button
3. **Display → Search**: Click "Back to Search" button
4. **Display → Account**: Click account card to view associated account
5. **Create → Display**: Automatically navigates after successful creation
6. **Create → Search**: Click "Cancel" button

## Future Enhancements

Planned improvements for these workcenters:

- [ ] Add more search filters (account, date created, etc.)
- [ ] Implement pagination for large contact lists
- [ ] Add sorting options (name, email, account)
- [x] Click on contact card to view details (✓ Implemented)
- [x] Create new contacts (✓ Implemented)
- [ ] Edit contact details
- [ ] Delete contacts
- [ ] Export search results
- [ ] Save search filters
- [ ] Connect to backend API for server-side operations
- [ ] Add keyboard shortcuts for navigation
- [ ] Add loading states
- [ ] Bulk operations (select multiple, bulk delete, etc.)
- [ ] Contact activity history
- [ ] Link contacts to multiple tickets

## Testing

The components have comprehensive test coverage. Run tests with:

```bash
npm test -- SearchContacts.test.tsx
npm test -- DisplayContact.test.tsx
npm test -- CreateContact.test.tsx
```

Tests cover:
- Rendering
- Search filtering (single and multiple fields)
- Case insensitivity
- Empty states
- User interactions
- Form validation
- Navigation
- Error handling

## Accessibility

The workcenters follow accessibility best practices:

- Proper label association with `htmlFor`
- Semantic HTML structure
- Keyboard navigation support
- Clear empty states with helpful messages
- ARIA attributes where needed
- Required field indicators
- Error message association with form fields
- Focus management

## Integration Example

Here's a complete example showing how to integrate the Contacts workcenters into your app:

```tsx
// App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SearchContacts, DisplayContact, CreateContact } from './workcenters/contacts';
import type { Contact, Account } from './workcenters/contacts';

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // In the future, fetch from API
    // For now, use sample data
    setAccounts([
      { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
      { id: 2, name: 'Globex', industry: 'Technology' },
    ]);
    
    setContacts([
      { id: 1, accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' },
      { id: 2, accountId: '1', fullName: 'Jane Smith', email: 'jane.smith@acme.com' },
      { id: 3, accountId: '2', fullName: 'Bob Johnson', email: 'bob@globex.com' },
    ]);
  }, []);

  const handleCreateContact = (fullName: string, email: string, accountId: string) => {
    const newId = Math.max(...contacts.map(c => c.id), 0) + 1;
    const newContact: Contact = {
      id: newId,
      accountId,
      fullName,
      email,
    };
    setContacts([...contacts, newContact]);
    return newId;
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/contacts/search" element={
            <SearchContacts contacts={contacts} accounts={accounts} />
          } />
          <Route path="/contact/:id" element={
            <DisplayContact contacts={contacts} accounts={accounts} tickets={tickets} />
          } />
          <Route path="/contacts/create" element={
            <CreateContact accounts={accounts} onCreateContact={handleCreateContact} />
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

## Directory Structure

```
workcenters/contacts/
├── search/
│   ├── SearchContacts.tsx       # Main component
│   ├── SearchContacts.css       # Styles
│   ├── SearchContacts.test.tsx  # Tests
│   └── index.ts                 # Barrel export
├── display/
│   ├── DisplayContact.tsx       # Main component
│   ├── DisplayContact.css       # Styles
│   ├── DisplayContact.test.tsx  # Tests
│   └── index.ts                 # Barrel export
├── create/
│   ├── CreateContact.tsx        # Main component
│   ├── CreateContact.css        # Styles
│   ├── CreateContact.test.tsx   # Tests
│   └── index.ts                 # Barrel export
├── index.ts                     # Main barrel export
└── README.md                    # This file
```

## Notes

- This is a **frontend-only** implementation using local filtering
- Search happens in the browser on the provided arrays
- For large datasets (1000+ contacts), consider server-side search
- Contact creation is handled by the parent component through the callback
- Contacts must be associated with an existing account
- The workcenters are not added to the sidebar navigation yet (add when ready)
