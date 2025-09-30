# Create Account Workcenter

The Create Account workcenter provides a simple form for creating new accounts in the CRM system.

## Features

- **Single required field**: Account name (mandatory)
- **Validation**: Ensures account name is not empty or whitespace-only
- **Auto-generation of IDs**: New accounts are assigned sequential IDs automatically
- **Navigation**: After successful creation, user is redirected to the newly created account's display page
- **Cancel option**: Users can cancel and return to the search accounts page

## Usage

### Accessing the workcenter

Users can access the Create Account workcenter in two ways:

1. **Via the sidebar navigation**: Navigate to Accounts → Create Account
2. **From the Search Accounts page**: Click the "Create New Account" button in the header

### Creating an account

1. Enter the account name in the text field
2. Click "Create Account" to submit
3. The system will:
   - Generate a new unique ID for the account
   - Add the account to the accounts list
   - Navigate to the Display Account workcenter showing the new account

### Validation

- The account name field is required and cannot be empty or contain only whitespace
- If validation fails, an error message is displayed below the input field
- Errors are cleared automatically when the user starts typing

## Component Props

```typescript
export interface CreateAccountProps {
  onCreateAccount: (name: string) => number;
}
```

- `onCreateAccount`: Callback function that creates a new account with the provided name and returns the new account's ID

## Future Enhancements

Potential improvements for this workcenter:

- Add industry field
- Add contact information fields
- Add notes/description field
- Support for custom account IDs
- Backend API integration
- Success notification/toast message
