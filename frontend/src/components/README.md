# Component Library

This directory contains reusable UI components for the My CRM application. All components follow consistent patterns, use the theme system, and are fully typed with TypeScript.

## Component Index

### Layout Components

#### Layout
The main layout wrapper component that provides consistent page structure.

**Location**: `components/Layout/Layout.tsx`

**Features**:
- Wraps entire application with consistent structure
- Includes header at the top
- Content area takes remaining space
- Prepared for future footer component
- Full-width header (no padding constraints)
- Page content gets proper padding

**Usage**:
```tsx
import { Layout } from './components/Layout/Layout';

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

**Props**:
- `children: ReactNode` - Page content to be wrapped
- `onBackToDashboard?: () => void` - Optional callback for the header's back button

**Sub-components**:
- Uses `Header` component internally

---

#### Header
The header component that appears at the top of the Layout.

**Location**: `components/Header/Header.tsx`

**Features**:
- My CRM logo button on the left
- User profile dropdown on the right
- Theme switcher in dropdown menu
- Responsive design
- Full-width, spans entire viewport

**Usage**:
```tsx
import { Header } from './components/Header/Header';

function CustomLayout() {
  return (
    <div>
      <Header />
      {/* Page content */}
    </div>
  );
}
```

**Note**: Typically you don't need to use Header directly - use the Layout component instead.

**Props**: 
- `onBackToDashboard?: () => void` - Callback when My CRM button is clicked

**Sub-components**:
- `ProfileDropdown`: User profile menu with initials badge and dropdown menu
- `ThemeSwitch`: Toggle for switching between light/dark themes (placeholder)

---



#### Dropdown
A dropdown menu component with trigger and content.

**Location**: `components/Dropdown/Dropdown.tsx`

**Features**:
- Controlled open/close state
- Click outside to close
- Keyboard navigation (Escape to close)
- Accessible with ARIA attributes

**Usage**:
```tsx
import { Dropdown } from './components/Dropdown/Dropdown';

<Dropdown
  trigger={<button>Open Menu</button>}
>
  <div>Menu content here</div>
</Dropdown>
```

**Props**:
- `trigger: ReactNode` - The element that triggers the dropdown
- `children: ReactNode` - Dropdown menu content
- `align?: 'left' | 'right'` - Dropdown alignment (default: 'right')

---

## Design Principles

### 1. Theme Integration
All components use CSS variables from `src/theme.css` for colors, spacing, and other design tokens.

```css
/* ✅ Good */
.component {
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
}

/* ❌ Bad */
.component {
  color: #ffffff;
  padding: 16px;
}
```

### 2. BEM Naming Convention
Components follow BEM (Block Element Modifier) methodology:

```css
.header { }                    /* Block */
.header__logo { }              /* Element */
.header__nav { }               /* Element */
.header__nav--mobile { }       /* Modifier */
```

### 3. TypeScript First
All components are fully typed with TypeScript interfaces:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  onClick?: () => void;
}

export const Button: FC<ButtonProps> = ({ variant = 'primary', children, onClick }) => {
  // Implementation
};
```

### 4. Accessibility
Components follow WCAG 2.1 Level AA standards:
- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly

### 5. Testing
All components should have corresponding test files:

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.css
│   └── Button.test.tsx
```

Test user interactions and accessibility:
```typescript
describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Component Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.css        # Component styles
├── ComponentName.test.tsx   # Component tests
├── index.ts                 # Barrel export
└── README.md               # Component documentation (for complex components)
```

### Barrel Exports
Each component folder should have an `index.ts` for clean imports:

```typescript
// components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

This allows clean imports:
```typescript
import { Button } from './components/Button';
// instead of
import { Button } from './components/Button/Button';
```

## Styling Guidelines

### 1. Component-Scoped Styles
Each component has its own CSS file with scoped class names:

```css
/* Button.css */
.button {
  /* Base styles */
}

.button--primary {
  /* Primary variant */
}

.button--secondary {
  /* Secondary variant */
}
```

### 2. Responsive Design
Use mobile-first approach:

```css
.component {
  /* Mobile styles (default) */
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .component {
    /* Tablet and desktop styles */
    padding: var(--spacing-lg);
  }
}
```

### 3. Transitions
Use theme transition variables for smooth interactions:

```css
.button {
  transition: background-color var(--transition-base);
}

.button:hover {
  background-color: var(--color-primary-light);
}
```

## State Management

### Component State
Use `useState` for local component state:

```typescript
export const Dropdown: FC<DropdownProps> = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  // ...
};
```

### Refs
Use `useRef` for DOM references:

```typescript
const dropdownRef = useRef<HTMLDivElement>(null);
```

### Event Handlers
Use `useCallback` for event handlers passed to children:

```typescript
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Common Patterns

### Click Outside Detection
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### Keyboard Navigation
```typescript
const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Escape') {
    setIsOpen(false);
  }
};
```

### Conditional CSS Classes
```typescript
const buttonClass = `button button--${variant} ${disabled ? 'button--disabled' : ''}`;
// Or use a utility function
import classNames from 'classnames';
const buttonClass = classNames('button', `button--${variant}`, {
  'button--disabled': disabled
});
```

## Adding New Components

When adding a new component:

1. **Create Component Structure**
   ```bash
   mkdir -p src/components/ComponentName
   touch src/components/ComponentName/ComponentName.tsx
   touch src/components/ComponentName/ComponentName.css
   touch src/components/ComponentName/ComponentName.test.tsx
   touch src/components/ComponentName/index.ts
   ```

2. **Define Types**
   ```typescript
   interface ComponentNameProps {
     // Props definition
   }
   ```

3. **Implement Component**
   - Use theme variables
   - Follow BEM naming
   - Add accessibility attributes
   - Handle keyboard navigation

4. **Write Tests**
   - Test rendering
   - Test interactions
   - Test accessibility

5. **Document**
   - Add to this README
   - Include usage examples
   - Document all props

6. **Export**
   ```typescript
   // index.ts
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './ComponentName';
   ```

## Future Components

Planned components to be added:

- [ ] **Button** - Reusable button component with variants
- [ ] **Input** - Text input with validation
- [ ] **Form** - Form wrapper with validation
- [ ] **Modal** - Dialog/modal overlay
- [ ] **Card** - Content card container
- [ ] **Table** - Data table with sorting
- [ ] **Tabs** - Tabbed interface
- [ ] **Toast** - Notification messages
- [ ] **Badge** - Small status indicators
- [ ] **Avatar** - User avatar with fallback
- [ ] **Loading** - Loading spinner/skeleton
- [ ] **Empty State** - Empty data placeholder
- [ ] **Pagination** - Page navigation

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/react)

## Questions?

If you have questions about components or need help creating new ones, refer to:
1. This documentation
2. Existing component implementations
3. The main frontend technical documentation (`docs/technical/frontend/README.md`)
4. Team discussions and code reviews
