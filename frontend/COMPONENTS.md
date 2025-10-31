# Frontend Component Library

This document provides comprehensive documentation for the reusable UI components in the CRM frontend application.

## 🚨 MANDATORY USAGE

**All developers MUST use these components when they are available.** Creating duplicate implementations or using raw HTML elements with custom styling is strictly prohibited for consistency and maintainability.

## Available Components

### Button

A reusable button component with consistent styling and dark mode support.

**Location:** `src/components/ui/Button.tsx`

#### Import

```tsx
import { Button } from '@/components/ui'
// or
import { Button } from '@/components/ui/Button'
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual style variant |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable the button |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |
| `onClick` | `(event: React.MouseEvent) => void` | - | Click handler |
| All other standard HTML button attributes | - | - | Supports all native button props |

#### Variants

- **primary**: Main call-to-action buttons (blue background)
- **secondary**: Secondary actions (gray background)
- **danger**: Destructive actions like delete (red background)

#### Usage Examples

**Basic Usage**
```tsx
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>
```

**Form Submit Button**
```tsx
<Button type="submit" variant="primary" disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Create Account'}
</Button>
```

**Danger/Delete Button**
```tsx
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>
```

**Secondary/Cancel Button**
```tsx
<Button variant="secondary" onClick={() => navigate(-1)}>
  Cancel
</Button>
```

**With Additional Classes**
```tsx
<Button variant="primary" className="w-full mt-4">
  Full Width Button
</Button>
```

#### Button as Link

For navigation buttons, use React Router's `Link` component styled as a button:

```tsx
import { Link } from 'react-router-dom'

<Link to="/accounts/new" className="btn btn-primary">
  Create Account
</Link>
```

Note: The `Button` component is for actual buttons (with onClick handlers). For links that look like buttons, use the native `Link` with button classes.

---

### Input

A reusable text input component with optional label and error message.

**Location:** `src/components/ui/Input.tsx`

#### Import

```tsx
import { Input } from '@/components/ui'
// or
import { Input } from '@/components/ui/Input'
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text for the input |
| `error` | `string` | - | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |
| `type` | `string` | `'text'` | Input type (text, email, tel, url, etc.) |
| `required` | `boolean` | `false` | Whether the field is required |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Current value (controlled) |
| `onChange` | `(event: React.ChangeEvent) => void` | - | Change handler |
| All other standard HTML input attributes | - | - | Supports all native input props |

#### Usage Examples

**Basic Usage**
```tsx
<Input
  label="Email"
  type="email"
  name="email"
  value={formData.email}
  onChange={handleChange}
/>
```

**Required Field**
```tsx
<Input
  label="Account Name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
/>
```
Note: The asterisk (*) is automatically added to the label when `required` is true.

**With Error Message**
```tsx
<Input
  label="Phone"
  type="tel"
  name="phone"
  value={formData.phone}
  onChange={handleChange}
  error={errors.phone}
/>
```

**Different Input Types**
```tsx
{/* Email */}
<Input
  label="Email Address"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
/>

{/* URL */}
<Input
  label="Website"
  type="url"
  name="website"
  value={website}
  onChange={handleChange}
/>

{/* Phone */}
<Input
  label="Phone Number"
  type="tel"
  name="phone"
  value={phone}
  onChange={handleChange}
/>

{/* Number */}
<Input
  label="Age"
  type="number"
  name="age"
  min="0"
  max="120"
  value={age}
  onChange={handleChange}
/>
```

**Without Label (Label Managed Separately)**
```tsx
<label htmlFor="customId" className="label">
  Custom Label
</label>
<Input
  id="customId"
  name="field"
  value={value}
  onChange={handleChange}
/>
```

---

### Textarea

A reusable multi-line text input component with optional label and error message.

**Location:** `src/components/ui/Input.tsx`

#### Import

```tsx
import { Textarea } from '@/components/ui'
// or
import { Textarea } from '@/components/ui/Input'
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text for the textarea |
| `error` | `string` | - | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |
| `rows` | `number` | - | Number of visible text rows |
| `required` | `boolean` | `false` | Whether the field is required |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Current value (controlled) |
| `onChange` | `(event: React.ChangeEvent) => void` | - | Change handler |
| All other standard HTML textarea attributes | - | - | Supports all native textarea props |

#### Usage Examples

**Basic Usage**
```tsx
<Textarea
  label="Description"
  name="description"
  value={formData.description}
  onChange={handleChange}
  rows={4}
/>
```

**Required Textarea**
```tsx
<Textarea
  label="Comments"
  name="comments"
  value={formData.comments}
  onChange={handleChange}
  rows={5}
  required
/>
```

**With Error Message**
```tsx
<Textarea
  label="Notes"
  name="notes"
  value={formData.notes}
  onChange={handleChange}
  rows={3}
  error={errors.notes}
/>
```

---

## Migration Guide

### Migrating from Raw HTML Elements

**Before:**
```tsx
<button
  type="submit"
  disabled={isLoading}
  className="btn btn-primary"
>
  Save
</button>
```

**After:**
```tsx
<Button
  type="submit"
  variant="primary"
  disabled={isLoading}
>
  Save
</Button>
```

---

**Before:**
```tsx
<label htmlFor="name" className="label">
  Account Name *
</label>
<input
  type="text"
  id="name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
  className="input"
/>
```

**After:**
```tsx
<Input
  label="Account Name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
/>
```

---

**Before:**
```tsx
<label htmlFor="description" className="label">
  Description
</label>
<textarea
  id="description"
  name="description"
  value={formData.description}
  onChange={handleChange}
  rows={4}
  className="input"
/>
```

**After:**
```tsx
<Textarea
  label="Description"
  name="description"
  value={formData.description}
  onChange={handleChange}
  rows={4}
/>
```

---

## Styling Guidelines

### DO NOT Customize Component Styles

❌ **Don't:**
```tsx
<Button variant="primary" style={{ backgroundColor: '#ff0000' }}>
  Custom Color
</Button>

<Input label="Name" className="bg-blue-500" />
```

✅ **Do:**
```tsx
// Use the predefined variants
<Button variant="danger">Delete</Button>

// Use utility classes for layout, not colors
<Button variant="primary" className="w-full mt-4">
  Full Width
</Button>
```

### Extending Components

If you need additional functionality, extend the component:

```tsx
// Create a specialized component
export function SubmitButton({ isLoading, children, ...props }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  )
}
```

---

## Dark Mode

All components automatically support dark mode via Tailwind CSS dark mode classes. No additional configuration is needed.

The theme is managed by `ThemeContext` and automatically detects system preferences.

---

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import { Button, type ButtonProps, type ButtonVariant } from '@/components/ui'
import { Input, type InputProps, Textarea, type TextareaProps } from '@/components/ui'
```

---

## Accessibility

All components follow accessibility best practices:

- **Button**: Proper ARIA attributes, keyboard navigation support
- **Input/Textarea**: 
  - Automatic label association via `htmlFor`
  - Error messages linked to inputs with ARIA
  - Required fields indicated visually and semantically

---

## Component Development Guidelines

### Adding New Components

When adding new reusable components:

1. **Create the component** in `src/components/ui/`
2. **Follow existing patterns**: Use forwardRef, include TypeScript types, support dark mode
3. **Export from index.ts**: Add to the barrel export
4. **Document here**: Add comprehensive documentation with examples
5. **Update Agents.md**: Reference the new component

### Component Requirements

All UI components must:

- ✅ Support dark mode
- ✅ Use predefined color scheme from `src/index.css`
- ✅ Include TypeScript types
- ✅ Use forwardRef for ref forwarding
- ✅ Follow existing naming conventions
- ✅ Include JSDoc comments
- ✅ Be fully documented in this file

---

## FAQs

### When should I use Button vs Link styled as button?

- Use `<Button>` for actions (onClick handlers): Save, Delete, Submit, Cancel
- Use `<Link className="btn btn-primary">` for navigation: "Create New", "View Details"

### Can I customize button colors?

No. Use the three predefined variants (primary, secondary, danger). If you need a different style, discuss with the team to add a new variant.

### What if I need a component that doesn't exist?

1. Check if an existing component can be extended
2. If not, create a new component following the guidelines above
3. Document it in this file
4. Update Agents.md

### How do I handle form validation errors?

Use the `error` prop on Input/Textarea components:

```tsx
<Input
  label="Email"
  name="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
/>
```

---

## Resources

- **Component Source**: `frontend/src/components/ui/`
- **Styles**: `frontend/src/index.css`
- **Theme Configuration**: `frontend/src/contexts/ThemeContext.tsx`
- **Color Palette**: Defined in `frontend/src/index.css` (@theme section)

---

## Enforcement

This component library is **mandatory**. Code reviews will reject:

- ❌ Raw `<button>` elements with `btn` classes (use `<Button>`)
- ❌ Raw `<input>` elements with `input` classes (use `<Input>`)
- ❌ Raw `<textarea>` elements with `input` classes (use `<Textarea>`)
- ❌ Custom styled components that duplicate existing functionality
- ❌ Components that don't use the predefined color scheme

Exceptions may be made for:
- ✅ Complex third-party library integrations
- ✅ Components with specialized behavior not covered by the library
- ✅ Temporary prototypes (must be replaced before merging)

---

**Last Updated:** 2025-10-31  
**Maintained By:** CRM Development Team
