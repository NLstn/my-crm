````markdown
# Input Component

A reusable text input component that follows the application's design system with support for labels, error states, helper text, icons, and multiple sizes.

## Features

- Built-in label support with required indicator
- Error state with error messages
- Helper text for guidance
- Left and right icon slots
- Multiple sizes (small, medium, large)
- Full-width option
- Disabled state
- Keyboard navigation support
- Fully accessible with ARIA support
- Consistent with theme system
- Smooth transitions and focus states

## Usage

### Basic Input

```tsx
import { Input } from './components/Input';

<Input placeholder="Enter text..." />
```

### With Label

```tsx
<Input 
  label="Email Address"
  placeholder="you@example.com"
/>
```

### Required Field

```tsx
<Input 
  label="Username"
  required
  placeholder="Enter your username"
/>
```

### With Helper Text

```tsx
<Input 
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>
```

### With Error State

```tsx
<Input 
  label="Email"
  error="Please enter a valid email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Sizes

```tsx
// Small input
<Input size="sm" placeholder="Small input" />

// Medium input (default)
<Input size="md" placeholder="Medium input" />

// Large input
<Input size="lg" placeholder="Large input" />
```

### Full Width

```tsx
<Input 
  fullWidth
  label="Full Width Input"
  placeholder="This input spans the full width"
/>
```

### With Icons

```tsx
// Left icon
<Input 
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>

// Right icon
<Input 
  rightIcon={<CheckIcon />}
  placeholder="Enter value..."
/>

// Both icons
<Input 
  leftIcon={<UserIcon />}
  rightIcon={<VerifiedIcon />}
  placeholder="Username"
/>
```

### Disabled State

```tsx
<Input 
  disabled
  label="Disabled Input"
  value="Cannot edit"
/>
```

## Complete Form Example

```tsx
import { useState, FormEvent } from 'react';
import { Input } from './components/Input';
import { Button } from './components/Button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Email"
        type="email"
        required
        fullWidth
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        error={errors.email}
        placeholder="you@example.com"
      />
      
      <Input 
        label="Password"
        type="password"
        required
        fullWidth
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        error={errors.password}
        helperText="Must be at least 8 characters"
      />
      
      <Button type="submit" fullWidth>
        Sign In
      </Button>
    </form>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'error'` | `'default'` | Visual style variant (automatically set to 'error' when error prop is provided) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `fullWidth` | `boolean` | `false` | Whether input takes full width |
| `label` | `string` | - | Label text for the input |
| `required` | `boolean` | `false` | Whether the field is required (shows asterisk) |
| `error` | `string` | - | Error message to display |
| `helperText` | `string` | - | Helper text to display (hidden when error is present) |
| `leftIcon` | `ReactNode` | - | Icon to display on the left |
| `rightIcon` | `ReactNode` | - | Icon to display on the right |
| `disabled` | `boolean` | `false` | Whether input is disabled |
| `placeholder` | `string` | - | Placeholder text |
| `type` | `string` | `'text'` | HTML input type |
| `value` | `string` | - | Controlled input value |
| `onChange` | `(e) => void` | - | Change event handler |
| `className` | `string` | `''` | Additional CSS classes |
| `id` | `string` | auto-generated | Input element ID |
| ...rest | `InputHTMLAttributes` | - | Other HTML input attributes |

## Accessibility

- Uses semantic `<input>` element
- Proper label association with `htmlFor` and `id`
- Required fields indicated with asterisk and accessible text
- Error messages linked via `aria-describedby`
- Helper text linked via `aria-describedby`
- `aria-invalid` attribute set when error is present
- Error messages use `role="alert"` for screen readers
- Focus-visible styles for keyboard users
- Properly handles disabled state

## Design Tokens

The component uses the following CSS variables from the theme:

### Colors
- `--color-primary` - Focus border color
- `--color-danger` - Error state colors
- `--color-border`, `--color-border-hover` - Border colors
- `--color-surface` - Background color
- `--color-background`, `--color-background-hover` - Hover background
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-muted` - Text colors

### Spacing
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`

### Border Radius
- `--radius-md`

### Typography
- `--font-family-base`
- `--font-size-sm`, `--font-size-base`, `--font-size-lg`
- `--font-weight-regular`, `--font-weight-medium`

### Transitions
- `--transition-base`

### Shadows
- `--color-info-bg`, `--color-danger-bg` - Focus shadows

## Examples

### Search Input

```tsx
<Input 
  leftIcon={<span>🔍</span>}
  placeholder="Search accounts..."
  aria-label="Search accounts"
/>
```

### Account Name Input

```tsx
const [name, setName] = useState('');
const [error, setError] = useState('');

<Input 
  label="Account Name"
  required
  fullWidth
  value={name}
  onChange={(e) => {
    setName(e.target.value);
    if (error) setError('');
  }}
  error={error}
  placeholder="Enter account name..."
/>
```

### Email Input with Validation

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) return 'Email is required';
  if (!emailRegex.test(value)) return 'Please enter a valid email';
  return '';
};

<Input 
  label="Email Address"
  type="email"
  required
  fullWidth
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={(e) => setError(validateEmail(e.target.value))}
  error={error}
  placeholder="you@example.com"
/>
```

### Password Input with Strength Indicator

```tsx
const [password, setPassword] = useState('');
const strength = calculatePasswordStrength(password);

<Input 
  label="Password"
  type="password"
  required
  fullWidth
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  helperText={`Password strength: ${strength}`}
  rightIcon={strength === 'Strong' ? <CheckIcon /> : null}
/>
```

## Testing

The Input component includes comprehensive tests covering:

- Rendering with and without label
- Required field indicator
- Helper text display
- Error state and messages
- Icon rendering (left and right)
- All size variants
- Full width option
- Disabled state
- User interactions (typing, focus, blur)
- Accessibility features (ARIA attributes, label association)
- Custom props and HTML attributes

Run tests with:

```bash
npm run test Input.test.tsx
```

## Browser Support

Works in all modern browsers that support:
- CSS custom properties (CSS variables)
- ES6+ JavaScript
- React 18+

## Related Components

- **Button** - Often used together in forms
- **Dropdown** - For select-type inputs (future)
- **Textarea** - For multi-line text input (future)
- **Checkbox** - For boolean inputs (future)

## Migration from HTML Input

Before:
```tsx
<div className="form-group">
  <label htmlFor="account-name" className="label">
    Account Name <span className="required">*</span>
  </label>
  <input
    id="account-name"
    type="text"
    className={`input ${error ? 'input--error' : ''}`}
    placeholder="Enter account name..."
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  {error && (
    <span className="error-message" role="alert">
      {error}
    </span>
  )}
</div>
```

After:
```tsx
<Input 
  label="Account Name"
  required
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={error}
  placeholder="Enter account name..."
/>
```

Benefits:
- Less boilerplate HTML/CSS
- Consistent styling across the app
- Built-in error handling
- Better accessibility out of the box
- Type-safe props with TypeScript
- Automatic label/input association

## Common Patterns

### Controlled Input with State

```tsx
const [value, setValue] = useState('');

<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Input with Debounced Search

```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  // Perform search with debouncedSearch
}, [debouncedSearch]);

<Input 
  leftIcon={<SearchIcon />}
  placeholder="Search..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Clear Button

```tsx
const [value, setValue] = useState('');

<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rightIcon={
    value && (
      <button 
        onClick={() => setValue('')}
        aria-label="Clear input"
      >
        ✕
      </button>
    )
  }
/>
```
````
