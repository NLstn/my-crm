# Frontend Technical Documentation

## Overview

The CRM frontend is built using React with TypeScript and Vite. This document provides technical guidelines, architecture decisions, and best practices

### Current Components

- **Layout**: Main application layout wrapper with header and content area
- **Header**: Application header with My CRM logo button and profile dropdown
- **Dropdown**: Dropdown menu with click-outside and keyboard navigation
- **ProfileDropdown**: User profile menu with initials badge and theme switch

## Technology Stack

- **Framework**: React 18.3
- **Language**: TypeScript 5.5
- **Build Tool**: Vite 5.4
- **Testing**: Vitest + React Testing Library
- **Styling**: CSS with CSS Custom Properties (CSS Variables)

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button/       # Button component
│   │   ├── Dropdown/     # Dropdown menu component
│   │   ├── Header/       # Header layout component
│   │   └── README.md     # Component library documentation
│   ├── hooks/            # Custom React hooks (future)
│   ├── services/         # API services and data fetching (future)
│   ├── types/            # TypeScript type definitions (future)
│   ├── utils/            # Utility functions (future)
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application styles
│   ├── main.tsx          # Application entry point
│   ├── theme.css         # Theme system with CSS variables
│   └── index.css         # Global styles and resets
├── public/               # Static assets
├── tests/                # Test files (future)
└── index.html           # HTML entry point
```

## Theme System

### Design Tokens

The application uses a comprehensive theme system based on CSS Custom Properties (CSS Variables) defined in `src/theme.css`. This approach provides:

- Centralized color management
- Easy theme switching (dark/light)
- Consistent design across the application
- Better maintainability

### Color Variables

#### Brand Colors
```css
--color-primary: #3b82f6         /* Primary brand color (blue) */
--color-primary-light: #60a5fa   /* Lighter variant */
--color-primary-dark: #2563eb    /* Darker variant */
--color-secondary: #8b5cf6       /* Secondary brand color (purple) */
```

#### Background Colors (Dark Theme)
```css
--color-background: #0f172a           /* Main background */
--color-background-elevated: #1e293b  /* Elevated surfaces */
--color-background-hover: #334155     /* Hover states */
--color-surface: #1e293b              /* Card/panel backgrounds */
--color-surface-raised: #334155       /* Raised surfaces */
```

#### Text Colors
```css
--color-text-primary: #f1f5f9      /* Primary text */
--color-text-secondary: #cbd5e1    /* Secondary text */
--color-text-tertiary: #94a3b8     /* Tertiary text */
--color-text-muted: #64748b        /* Muted/disabled text */
--color-text-inverted: #0f172a     /* Inverted text (for dark backgrounds) */
```

#### Semantic Colors
```css
--color-success: #10b981           /* Success states */
--color-warning: #f59e0b           /* Warning states */
--color-danger: #ef4444            /* Error/danger states */
--color-info: #3b82f6              /* Info states */
```

#### Status Colors (for tickets/tasks)
```css
--color-status-open: #3b82f6
--color-status-in-progress: #f59e0b
--color-status-closed: #10b981
```

### Design Tokens

#### Spacing
```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 0.75rem    /* 12px */
--spacing-lg: 1rem       /* 16px */
--spacing-xl: 1.5rem     /* 24px */
--spacing-2xl: 2rem      /* 32px */
--spacing-3xl: 3rem      /* 48px */
```

#### Border Radius
```css
--radius-sm: 0.375rem    /* 6px */
--radius-md: 0.5rem      /* 8px */
--radius-lg: 0.75rem     /* 12px */
--radius-xl: 1rem        /* 16px */
--radius-full: 9999px    /* Fully rounded */
```

#### Typography
```css
--font-family-base: 'Inter', system-ui, sans-serif
--font-size-xs: 0.75rem      /* 12px */
--font-size-sm: 0.875rem     /* 14px */
--font-size-base: 1rem       /* 16px */
--font-size-lg: 1.125rem     /* 18px */
--font-size-xl: 1.25rem      /* 20px */
--font-size-2xl: 1.5rem      /* 24px */
--font-size-3xl: 1.875rem    /* 30px */
```

#### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-md: Medium shadow for cards
--shadow-lg: Large shadow for elevated elements
--shadow-xl: Extra large shadow
--shadow-primary: Primary color shadow for emphasis
--shadow-hover: Hover state shadow
```

#### Transitions
```css
--transition-fast: 150ms ease
--transition-base: 200ms ease
--transition-slow: 300ms ease
```

### Theme Usage

#### Using Theme Variables in CSS
Always use CSS variables instead of hardcoded colors:

```css
/* ❌ Bad */
.button {
  background-color: #3b82f6;
  color: #ffffff;
}

/* ✅ Good */
.button {
  background-color: var(--color-primary);
  color: var(--color-text-inverted);
}
```

#### Using Spacing Variables
```css
/* ❌ Bad */
.card {
  padding: 24px;
  margin-bottom: 16px;
}

/* ✅ Good */
.card {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}
```

#### Using Typography Variables
```css
/* ❌ Bad */
.heading {
  font-size: 1.5rem;
  font-weight: 600;
}

/* ✅ Good */
.heading {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}
```

## Component Library

The application now includes a reusable component library in `src/components/`. See the [Component Library README](../../../frontend/src/components/README.md) for comprehensive documentation on all available components.

### Current Components

- **Button**: Flexible button component with multiple variants (primary, secondary, ghost)
- **Dropdown**: Dropdown menu with click-outside and keyboard navigation
- **Header**: Application header with back button and profile dropdown
- **ProfileDropdown**: User profile menu with initials avatar and theme switcher

### Component Organization

```typescript
// Component structure
components/
├── Layout/           # Main layout wrapper
│   ├── Layout.tsx
│   ├── Layout.css
│   ├── Layout.test.tsx
│   └── index.ts
├── Header/           # Header component
│   ├── Header.tsx
│   ├── Header.css
│   ├── Header.test.tsx
│   ├── ProfileDropdown.tsx
│   ├── ProfileDropdown.css
│   └── index.ts
├── Dropdown/         # Dropdown menu component
│   ├── Dropdown.tsx
│   ├── Dropdown.css
│   ├── Dropdown.test.tsx
│   └── index.ts
└── README.md        # Component library documentation
```

### Using Components

Import components from their barrel exports:

```typescript
import { Layout } from './components/Layout';
import { Dropdown } from './components/Dropdown';

function App() {
  return (
    <Layout>
      <div className="page-content">
        {/* Your page content with its own padding */}
      </div>
    </Layout>
  );
}
```

### Layout Architecture

The application now uses a proper layout architecture:

1. **Layout Component** (`components/Layout/`): 
   - Wraps the entire application
   - Provides consistent structure across all pages
   - Contains the Header component
   - Content area for page-specific content
   - Prepared for future Footer component

2. **Header Component** (`components/Header/`):
   - Full-width navigation bar
   - Sticky positioning at top of viewport
   - Contains My CRM logo/back button and profile menu
   - No padding constraints from parent

3. **Page Content**:
   - Wrapped by Layout component
   - Applies its own padding/spacing
   - Independent from header/footer layout

This separation ensures:
- Header spans full viewport width
- Content can have proper padding without affecting header
- Easy to add footer in the future
- Consistent layout across all pages
- Clean component boundaries

## Component Patterns

### Current Architecture

The application now uses a component-based architecture with reusable components in `src/components/`. The `App.tsx` contains the main application logic and uses the Header component for consistent navigation.

### Future Component Organization

```typescript
// Future component structure
components/
├── common/           # Shared components (Button, Input, etc.) - Future
├── layout/          # Layout components - DONE: Layout, Header, Dropdown
│   ├── Layout/      # ✅ Main layout wrapper
│   ├── Header/      # ✅ Header with navigation
│   └── Footer/      # Future: Footer component
├── features/        # Feature-specific components (future)
│   ├── accounts/
│   ├── contacts/
│   └── tickets/
```

### Component Template

```typescript
import { FC } from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  // Props definition
}

export const ComponentName: FC<ComponentNameProps> = ({ /* props */ }) => {
  // Component logic
  
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};
```

### State Management

Currently using React hooks (`useState`, `useMemo`). For future expansion:

- Local state: `useState` for component-specific state
- Derived state: `useMemo` for computed values
- Side effects: `useEffect` for data fetching, subscriptions
- Context API: For shared state across multiple components
- Consider Redux/Zustand for complex global state

## Styling Guidelines

### BEM Naming Convention

The project uses BEM (Block Element Modifier) methodology:

```css
/* Block */
.panel { }

/* Element */
.panel__header { }
.panel__content { }

/* Modifier */
.panel--highlighted { }
.list__item--active { }
```

### CSS Best Practices

1. **Use CSS Variables**: Always reference theme variables
2. **Avoid Inline Styles**: Keep styles in CSS files
3. **Mobile-First**: Write mobile styles first, then add media queries
4. **Scoped Styles**: Component-specific styles in component CSS files
5. **Consistent Naming**: Use BEM or similar methodology
6. **No Magic Numbers**: Use spacing/sizing variables

### Responsive Design

Current breakpoints:
```css
/* Mobile: < 1100px */
@media (max-width: 1100px) {
  /* Single column layout */
}

/* Desktop: >= 1100px (default) */
```

## TypeScript Guidelines

### Type Definitions

Define interfaces for all data models:

```typescript
export type Account = {
  id: string;
  name: string;
  industry: string;
};

export type Contact = {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
};
```

### Type Safety

- Use TypeScript strict mode
- Avoid `any` types
- Define props interfaces for all components
- Use union types for status fields: `'open' | 'in_progress' | 'closed'`

## Testing

### Testing Stack

- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM matchers

### Running Tests

```bash
npm test              # Run tests in watch mode
npm test -- --run    # Run tests once
npm test -- --ui     # Run with Vitest UI
```

### Testing Best Practices

1. Test user behavior, not implementation
2. Use semantic queries (getByRole, getByLabelText)
3. Test accessibility
4. Mock external dependencies (API calls)
5. Aim for meaningful coverage, not 100%

### Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const { user } = render(<ComponentName />);
    await user.click(screen.getByRole('button'));
    // Assert expected behavior
  });
});
```

## Development Workflow

### Scripts

```bash
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm test           # Run tests
```

### Code Quality

- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict mode enabled
- **Prettier**: (Recommended for future setup)

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests and linting
4. Submit PR for review
5. Merge after approval

## API Integration (Future)

### Service Layer Pattern

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = {
  accounts: {
    getAll: () => fetch(`${API_BASE_URL}/accounts`).then(r => r.json()),
    getById: (id: string) => fetch(`${API_BASE_URL}/accounts/${id}`).then(r => r.json()),
  },
  // ... other resources
};
```

### Error Handling

```typescript
try {
  const data = await api.accounts.getAll();
  setAccounts(data);
} catch (error) {
  console.error('Failed to fetch accounts:', error);
  setError('Failed to load accounts');
}
```

## Performance Considerations

### Current Optimizations

- `useMemo` for derived state (filtered contacts/tickets)
- Vite for fast HMR during development
- CSS variables for efficient style updates

### Future Optimizations

- Code splitting with React.lazy()
- Virtual scrolling for large lists
- Debounce search inputs
- Optimize re-renders with React.memo()
- Image optimization
- Bundle size analysis

## Accessibility

### Current Implementation

- Semantic HTML elements
- Button elements for interactive items
- Proper heading hierarchy (h1, h2, h3)

### Best Practices to Follow

- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast ratios (WCAG AA minimum)
- Add focus indicators
- Test with screen readers
- Use semantic HTML5 elements

## Environment Variables

Create `.env.local` for local development:

```bash
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=My CRM
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Browser Support

Target modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

## Build and Deployment

### Production Build

```bash
npm run build
```

Output: `dist/` directory with optimized static files

### Deployment Considerations

- Set `VITE_API_URL` to production API endpoint
- Enable HTTPS
- Configure CORS on backend
- Set proper cache headers
- Use CDN for static assets (optional)

## Future Enhancements

### Planned Features

1. **Theme Switcher**: Toggle between dark/light themes (UI ready, needs implementation)
2. ~~**Component Library**: Extract reusable components~~ ✅ **COMPLETED**
3. **Form Management**: Add/edit accounts, contacts, tickets
4. **Real API Integration**: Connect to backend API
5. **State Management**: Add global state solution
6. **Routing**: Multi-page navigation (React Router)
7. **Authentication**: User login/logout
8. **Real-time Updates**: WebSocket support
9. **Data Persistence**: Local storage for offline support
10. **Advanced Filtering**: Search and filter functionality

### Technical Debt

- ~~Extract components from App.tsx~~ ✅ **DONE** - Header component created
- Add comprehensive test coverage (basic tests added for components)
- Set up Prettier for code formatting
- Add Storybook for component development
- Implement proper error boundaries
- Add loading states
- Improve type safety (remove sample data types from App.tsx)
- Complete theme switcher functionality in ProfileDropdown

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [MDN CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## Contributing

When adding new features:

1. Follow the established patterns and conventions
2. Use CSS variables for all colors and spacing
3. Write TypeScript with proper types
4. Add tests for new functionality
5. Update this documentation as needed
6. Keep components small and focused
7. Consider accessibility in all UI decisions

## Support

For questions or issues:
- Check this documentation first
- Review existing code for patterns
- Consult team members
- Document new patterns as they emerge
