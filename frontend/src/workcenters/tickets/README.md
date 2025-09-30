# Tickets Workcenter

A collection of workcenter components for managing support tickets in the CRM system.

## Components

### CreateTicket
Component for creating new support tickets with title, account association, and status.

**Path**: `/tickets/create`

### DisplayTicket
Component for viewing detailed information about a specific ticket, including associated account, contacts, and related tickets.

**Path**: `/ticket/:id`

### SearchTickets
Component for searching and filtering tickets by title and status.

**Path**: `/tickets/search`

## Features

- **Create tickets**: Add new support tickets with account association
- **View ticket details**: See comprehensive ticket information with related data
- **Search and filter**: Find tickets by title or status
- **Status tracking**: Track tickets through open, in progress, and closed states
- **Related data**: View associated accounts, contacts, and related tickets
- **Navigation**: Easy navigation between tickets, accounts, and contacts

## Usage

```tsx
import { SearchTickets, DisplayTicket, CreateTicket } from './workcenters/tickets';

// In your routing setup
<Routes>
  <Route path="/tickets/search" element={<SearchTickets tickets={tickets} accounts={accounts} />} />
  <Route path="/tickets/create" element={<CreateTicket accounts={accounts} onCreateTicket={handleCreateTicket} />} />
  <Route path="/ticket/:id" element={<DisplayTicket tickets={tickets} accounts={accounts} contacts={contacts} />} />
</Routes>
```

## Data Models

### Ticket
```typescript
interface Ticket {
  id: string;
  accountId: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
}
```

### Account
```typescript
interface Account {
  id: number;
  name: string;
  industry: string;
}
```

### Contact
```typescript
interface Contact {
  id: number;
  accountId: string;
  fullName: string;
  email: string;
}
```

## Navigation Flow

1. **Search** → **Display**: Click on a ticket card to view details
2. **Search** → **Create**: Click "Create New Ticket" button
3. **Create** → **Display**: Automatically navigated after successful creation
4. **Display** → **Search**: Click "Back to Search" button
5. **Display** → **Account**: Click on associated account card
6. **Display** → **Contact**: Click on contact card in the list
7. **Display** → **Other Tickets**: Click on related ticket cards

## Status Colors

The components use CSS custom properties for status badge colors:
- **Open**: `--color-status-open` / `--color-status-open-bg`
- **In Progress**: `--color-status-in-progress` / `--color-status-in-progress-bg`
- **Closed**: `--color-status-closed` / `--color-status-closed-bg`
