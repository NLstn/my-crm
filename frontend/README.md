# CRM Frontend - React + TypeScript + Vite

This is the frontend application for the CRM system, built with React and TypeScript using Vite as the build tool.

## Technology Stack

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

## Features

### Color Scheme & Dark Mode

The application uses a strict color scheme defined in `tailwind.config.js`:

- **Primary Colors** (Blue): Main branding and primary actions
- **Secondary Colors** (Purple): Accents and secondary elements
- **Success Colors** (Green): Success states and confirmations
- **Warning Colors** (Orange): Warnings and important notices
- **Error Colors** (Red): Errors and destructive actions
- **Gray Scale**: Text and backgrounds

**Dark mode is automatically enabled** based on system preferences and can be toggled manually using the theme switcher in the header.

⚠️ **Important**: NO custom colors are allowed. Always use the predefined color classes from the theme.

### Components

- **Layout**: Main application layout with navigation and theme toggle
- **Cards**: Reusable card components with dark mode support
- **Forms**: Form inputs, buttons, and labels with consistent styling
- **Badges**: Status indicators with predefined color variants

### Pages

All pages support CRUD operations and are fully integrated with the OData v4 backend:

- **Dashboard**: Overview of the CRM system
- **Accounts**: List, view, create, and edit accounts
- **Contacts**: Manage contacts associated with accounts
- **Issues**: Track and manage support tickets
- **Data Cockpit**: Catalog of CSV import/export actions for every entity

## Development

### Prerequisites

- Node.js 20+ (included in dev container)

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable components
│   └── Layout.tsx     # Main layout with navigation
├── contexts/          # React contexts
│   └── ThemeContext.tsx  # Theme (dark/light mode) provider
├── lib/               # Utilities and helpers
│   └── api.ts         # Axios API client with OData support
├── pages/             # Page components
│   ├── Dashboard.tsx
│   ├── Accounts/
│   │   ├── AccountsList.tsx
│   │   ├── AccountDetail.tsx
│   │   └── AccountForm.tsx
│   ├── Contacts/
│   │   ├── ContactsList.tsx
│   │   ├── ContactDetail.tsx
│   │   └── ContactForm.tsx
│   └── Issues/
│       ├── IssuesList.tsx
│       ├── IssueDetail.tsx
│       └── IssueForm.tsx
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main app component with routing
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind directives
```

## API Integration

The frontend communicates with the OData v4 backend using Axios. The API client is configured in `src/lib/api.ts` and automatically:

- Adds OData headers
- Handles OData response format (extracts `value` property)
- Proxies requests through Vite dev server

### Example Usage

```typescript
import api from '@/lib/api'

// Get all accounts with contacts expanded
const response = await api.get('/Accounts?$expand=Contacts')
const accounts = response.data.items

// Create a new account
await api.post('/Accounts', {
  Name: 'New Company',
  Industry: 'Technology',
  Email: 'contact@example.com',
})

// Update an account
await api.patch('/Accounts(1)', {
  Phone: '+1-555-0123',
})
```

## Styling Guidelines

### Using Colors

Always use the predefined color classes:

```tsx
// ✅ Good
<button className="btn btn-primary">Save</button>
<div className="text-error-600 dark:text-error-400">Error message</div>

// ❌ Bad - no custom colors!
<button style={{ backgroundColor: '#ff0000' }}>Save</button>
<div className="text-[#ff0000]">Error message</div>
```

### Dark Mode Support

Always include dark mode variants for colors:

```tsx
// Background and text
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>

// Borders
<div className="border border-gray-200 dark:border-gray-800">
  Card content
</div>
```

### Utility Classes

Common utility classes are defined in `src/index.css`:

- `.btn` - Base button styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Destructive button
- `.card` - Card container
- `.input` - Form input
- `.label` - Form label
- `.badge-*` - Status badges

## Contributing

When adding new features:

1. Follow the existing component structure
2. Use TypeScript with strict typing
3. Support dark mode for all new components
4. Use the predefined color scheme only
5. Use React Query for API calls
6. Keep components small and focused
7. Use semantic HTML and accessibility best practices

## Next Steps

Potential improvements:
- Add loading skeletons
- Implement optimistic updates
- Add form validation with a library
- Improve error handling and user feedback
- Add keyboard shortcuts
- Implement drag-and-drop functionality
- Add data export features
