# Sidebar Component

A navigation sidebar component that slides in from the left side of the screen with a fade-in animation. The sidebar displays a list of work centers that users can navigate to.

## Features

- **Overlay Design**: Opens over the current page without shifting content
- **Backdrop**: Semi-transparent backdrop that closes the sidebar when clicked
- **Fade-in Animation**: Smooth slide-in animation when opening
- **Responsive**: Adapts to mobile screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation support
- **Close Options**: Can be closed via close button, backdrop click, or after navigation

## Usage

```tsx
import { Sidebar, WorkCenter } from './components/Sidebar';

const workCenters: WorkCenter[] = [
  { id: 'accounts', name: 'Accounts', icon: '👥', path: '/accounts' },
  { id: 'contacts', name: 'Contacts', icon: '📇', path: '/contacts' },
];

function MyApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (workCenter: WorkCenter) => {
    console.log('Navigating to:', workCenter.path);
    // Add your navigation logic here
  };

  return (
    <>
      <button onClick={() => setIsSidebarOpen(true)}>Open Menu</button>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        workCenters={workCenters}
        onNavigate={handleNavigate}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls whether the sidebar is open or closed |
| `onClose` | `() => void` | Yes | Callback function called when the sidebar should close |
| `workCenters` | `WorkCenter[]` | Yes | Array of work center items to display |
| `onNavigate` | `(workCenter: WorkCenter) => void` | No | Callback function called when a work center is clicked |

### WorkCenter Type

```typescript
interface WorkCenter {
  id: string;        // Unique identifier
  name: string;      // Display name
  icon?: string;     // Optional icon (emoji or text)
  path: string;      // Navigation path
}
```

## Styling

The component uses CSS custom properties from the theme system:

- `--color-surface`: Background color
- `--color-border`: Border colors
- `--color-text-primary` / `--color-text-secondary`: Text colors
- `--color-background-hover`: Hover state background
- `--spacing-*`: Consistent spacing
- `--radius-md`: Border radius
- `--transition-base`: Animation duration
- `--shadow-lg`: Box shadow

## Animation

The sidebar features two animations:

1. **Slide-in**: The sidebar slides in from the left using CSS transforms
2. **Backdrop Fade-in**: The backdrop fades in smoothly

Both animations use the `--transition-base` timing variable for consistency.

## Accessibility

- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for close button
- Semantic HTML structure

## Integration with Layout

The Sidebar is automatically integrated with the `Layout` component. The Layout provides:

- Default work centers (Accounts and Contacts)
- State management for sidebar open/close
- Integration with the Header's hamburger menu

```tsx
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      {/* Your app content */}
    </Layout>
  );
}
```

Custom work centers can be passed to the Layout:

```tsx
const customWorkCenters = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', path: '/' },
  { id: 'reports', name: 'Reports', icon: '📈', path: '/reports' },
];

<Layout 
  workCenters={customWorkCenters}
  onNavigate={(wc) => console.log('Navigate to', wc.path)}
>
  {/* Your app content */}
</Layout>
```
