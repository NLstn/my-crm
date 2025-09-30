# CreateTicket Workcenter

A workcenter component for creating new support tickets in the CRM system.

## Features

- Form with title, account selection, and status
- Real-time validation with error messages
- Account selection dropdown
- Status selection (Open, In Progress, Closed)
- Input trimming to prevent whitespace issues
- Cancel button to return to search
- Automatic navigation to the newly created ticket after submission

## Props

```typescript
interface CreateTicketProps {
  accounts: Account[];
  onCreateTicket: (title: string, accountId: string, status: 'open' | 'in_progress' | 'closed') => string;
}
```

- `accounts`: List of accounts available for ticket assignment
- `onCreateTicket`: Callback function that creates a ticket and returns the new ticket ID

## Usage

```tsx
import { CreateTicket } from './workcenters/tickets';

function App() {
  const handleCreateTicket = (title: string, accountId: string, status: 'open' | 'in_progress' | 'closed') => {
    // Create ticket logic
    return newTicketId;
  };

  return (
    <CreateTicket 
      accounts={accounts}
      onCreateTicket={handleCreateTicket}
    />
  );
}
```

## Validation Rules

- **Title**: Required, cannot be empty or only whitespace
- **Account**: Required, must select an account from the dropdown
- **Status**: Required, defaults to "open"

## Navigation

- On successful creation: Navigates to `/ticket/{id}`
- On cancel: Navigates to `/tickets/search`
