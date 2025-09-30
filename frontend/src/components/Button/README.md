# Button Component

A reusable button component that follows the application's design system with support for multiple variants, sizes, and states.

## Features

- Multiple visual variants (primary, secondary, ghost, danger)
- Three sizes (small, medium, large)
- Full-width option
- Disabled state
- Keyboard navigation support
- Fully accessible with ARIA support
- Consistent with theme system
- Smooth transitions and hover effects

## Usage

### Basic Button

```tsx
import { Button } from './components/Button';

<Button onClick={handleClick}>
  Click me
</Button>
```

### Variants

```tsx
// Primary button (default) - main actions
<Button variant="primary">Save</Button>

// Secondary button - alternative actions
<Button variant="secondary">Cancel</Button>

// Ghost button - tertiary actions
<Button variant="ghost">Skip</Button>

// Danger button - destructive actions
<Button variant="danger">Delete</Button>
```

### Sizes

```tsx
// Small button
<Button size="sm">Small</Button>

// Medium button (default)
<Button size="md">Medium</Button>

// Large button
<Button size="lg">Large</Button>
```

### Full Width

```tsx
<Button fullWidth>
  Full Width Button
</Button>
```

### Disabled State

```tsx
<Button disabled>
  Disabled Button
</Button>
```

### Form Submission

```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit" variant="primary">
    Submit Form
  </Button>
</form>
```

### With Custom Styling

```tsx
<Button className="custom-class" variant="primary">
  Custom Styled Button
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Whether button takes full width |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Button content (required) |
| `onClick` | `() => void` | - | Click handler |
| ...rest | `ButtonHTMLAttributes` | - | Other HTML button attributes |

## Accessibility

- Uses semantic `<button>` element
- Supports keyboard navigation (Enter and Space keys)
- Includes focus-visible styles for keyboard users
- Properly handles disabled state
- Accepts all ARIA attributes via props spread

## Design Tokens

The component uses the following CSS variables from the theme:

### Colors
- `--color-primary`, `--color-primary-light` - Primary variant
- `--color-danger`, `--color-danger-light` - Danger variant
- `--color-surface`, `--color-background-hover` - Secondary variant
- `--color-border`, `--color-border-hover` - Borders
- `--color-text-primary` - Text color

### Spacing
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`

### Border Radius
- `--radius-md`

### Typography
- `--font-family-base`
- `--font-size-sm`, `--font-size-base`, `--font-size-lg`
- `--font-weight-medium`

### Transitions
- `--transition-base`

### Shadows
- `--shadow-sm`
- `--color-info-bg`, `--color-danger-bg` - Focus shadows

## Examples

### Action Buttons

```tsx
<div style={{ display: 'flex', gap: '1rem' }}>
  <Button variant="primary" onClick={handleSave}>
    Save
  </Button>
  <Button variant="secondary" onClick={handleCancel}>
    Cancel
  </Button>
</div>
```

### Destructive Action with Confirmation

```tsx
const handleDelete = () => {
  if (confirm('Are you sure?')) {
    deleteItem();
  }
};

<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>
```

### Navigation Button

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<Button onClick={() => navigate('/accounts/create')}>
  Create New Account
</Button>
```

### Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button disabled={isLoading} onClick={handleSubmit}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Button Group

```tsx
<div className="button-group">
  <Button variant="primary" size="sm">Apply</Button>
  <Button variant="secondary" size="sm">Reset</Button>
  <Button variant="ghost" size="sm">Clear</Button>
</div>
```

## Testing

The Button component includes comprehensive tests covering:

- Rendering with children
- All variant styles
- All size options
- Full width option
- Click interactions
- Disabled state
- Custom className
- HTML button attributes
- Keyboard accessibility
- Type attribute

Run tests with:

```bash
npm run test Button.test.tsx
```

## Browser Support

Works in all modern browsers that support:
- CSS custom properties (CSS variables)
- ES6+ JavaScript
- React 18+

## Related Components

- **Dropdown** - Can use Button as trigger
- **Form components** - Often used together in forms
- **Modal** - Common for modal actions

## Migration from HTML Button

Before:
```tsx
<button
  type="button"
  className="search-accounts__create-button"
  onClick={handleClick}
>
  Create New Account
</button>
```

After:
```tsx
<Button onClick={handleClick}>
  Create New Account
</Button>
```

Benefits:
- Consistent styling across the app
- Built-in variants and sizes
- Better accessibility
- Less CSS to maintain
- Type-safe props with TypeScript
