---
description: Component development patterns and architecture
applyTo: 'src/components/**'
---

# Component Development Instructions

Guidelines for creating and organizing components following the project's component architecture.

---

## 1. Component Categories

### Primitives (`src/components/primitives/`)

**Purpose**: Low-level, reusable building blocks

**Examples**:
- `Container.astro` - Width constraints and centering
- `Stack.astro` - Vertical spacing layout
- `Section.astro` - Semantic section with container + stack
- `Button.astro` - Base button component
- `Badge.astro` - Status/tag indicator

**Characteristics**:
- Single responsibility
- Highly reusable
- Minimal dependencies
- Prop-driven styling
- Well-documented variants

**Template**:
```astro
---
/**
 * PrimitiveName - One-line description
 * 
 * @example
 * <PrimitiveName variant="primary" size="md">
 *   Content
 * </PrimitiveName>
 */
export interface Props {
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}
---
```

### UI Components (`src/components/ui/`)

**Purpose**: Generic UI elements used across features

**Examples**:
- `CoinFlipImage.astro` - Interactive image flipper
- `OptimizedImage.astro` - Optimized image with formats
- `Card.astro` - Content card
- `Modal.astro` - Dialog overlay

**Characteristics**:
- Composed from primitives
- Domain-agnostic
- Self-contained functionality
- Accessibility built-in

### Layout Components (`src/components/layout/`)

**Purpose**: Page structure and navigation

**Examples**:
- `Header.astro` - Site header
- `Footer.astro` - Site footer
- `NavBar.astro` - Navigation bar
- `BaseLayout.astro` - Page wrapper

**Characteristics**:
- Control page structure
- Contain global elements
- Handle responsive layouts
- Manage navigation state

### Feature Components (`src/components/features/`)

**Purpose**: Domain-specific components organized by feature area

**Structure**:
```
features/
├── home/          # Homepage components
├── blog/          # Blog-specific components
├── projects/      # Project display components
├── contact/       # Contact form components
├── search/        # Search overlay components
└── about/         # About page components
```

**Characteristics**:
- Feature-specific logic
- Compose UI + primitives
- May include business logic
- Localized to feature area

### Islands (`src/components/islands/`)

**Purpose**: Client-side interactive React components

**Examples**:
- `AIChatIsland.tsx` - AI chat widget
- `ContactFormIsland.tsx` - Contact form with validation
- `ThemeToggle.tsx` - Dark/light mode switcher
- `NavBarIsland.tsx` - Mobile navigation

**Characteristics**:
- React components (`.tsx`)
- Client-side hydration
- Event handlers and state
- Use `client:*` directives

**Hydration Strategies**:
```astro
<Island client:load />      <!-- Load on page load -->
<Island client:idle />      <!-- Load when idle -->
<Island client:visible />   <!-- Load when visible -->
<Island client:only="react" /> <!-- No SSR -->
```

---

## 2. Naming Conventions

### Files
- **Astro components**: PascalCase (e.g., `MyComponent.astro`)
- **React components**: PascalCase with `.tsx` (e.g., `MyIsland.tsx`)
- **Utilities**: camelCase (e.g., `helpers.ts`)

### Component Names
- Descriptive and clear
- Reflects purpose, not implementation
- Avoid generic names like `Wrapper`, `Container` unless truly generic

### Props
- camelCase for prop names
- Boolean props: `is*`, `has*`, `should*` prefixes
- Event handlers: `on*` prefix (e.g., `onClick`, `onSubmit`)

---

## 3. Component Structure

### Astro Component Template

```astro
---
/**
 * ComponentName - Brief description
 * 
 * Detailed explanation of purpose and usage.
 * 
 * @example
 * <ComponentName title="Example" variant="primary">
 *   <p>Content</p>
 * </ComponentName>
 * 
 * @accessibility
 * - Semantic HTML elements
 * - Keyboard navigation support
 * - ARIA attributes where needed
 */

import Container from '@/components/primitives/Container.astro';
import Button from '@/components/primitives/Button.astro';

export interface Props {
  /** Component title */
  title: string;
  
  /** Visual variant */
  variant?: 'default' | 'primary' | 'secondary';
  
  /** Additional CSS classes */
  class?: string;
}

const {
  title,
  variant = 'default',
  class: className = '',
  ...rest
} = Astro.props;

// Component logic here
---

<section class={`component-wrapper ${className}`} {...rest}>
  <Container>
    <h2>{title}</h2>
    <slot />
  </Container>
</section>

<style>
/* Scoped styles only when necessary */
/* Prefer Tailwind utilities */
</style>
```

### React Island Template

```tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';

export interface IslandNameProps {
  /** Prop description */
  initialValue?: string;
  
  /** Event handler */
  onAction?: (value: string) => void;
}

/**
 * IslandName - Brief description
 * 
 * @example
 * <IslandName initialValue="test" onAction={handler} />
 */
const IslandName: FC<IslandNameProps> = ({ 
  initialValue = '',
  onAction 
}) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div className="island-wrapper">
      {/* Component JSX */}
    </div>
  );
};

export default IslandName;
```

---

## 4. Composition Patterns

### Slot-Based Composition

```astro
<Component>
  <div slot="header">Header content</div>
  <p>Default slot content</p>
  <div slot="footer">Footer content</div>
</Component>
```

### Props-Based Composition

```astro
<Component
  header={<HeaderComponent />}
  footer={<FooterComponent />}
>
  Content
</Component>
```

### Primitive Composition

```astro
<Section padding="lg">
  <Container size="md">
    <Stack gap="md">
      <Heading level={1}>Title</Heading>
      <Text>Description</Text>
      <Button variant="primary">Action</Button>
    </Stack>
  </Container>
</Section>
```

---

## 5. Styling Guidelines

### Tailwind-First

```astro
<!-- Good: Use Tailwind utilities -->
<div class="flex items-center gap-4 p-6 bg-surface rounded-lg">

<!-- Avoid: Inline styles -->
<div style="display: flex; gap: 1rem;">
```

### Design Token Usage

```astro
<!-- Good: Semantic tokens -->
<p class="text-foreground text-base">

<!-- Avoid: Direct colors -->
<p class="text-gray-800">
```

### Scoped Styles

Use only when necessary:
```astro
<style>
  /* Component-specific styles that can't be expressed with Tailwind */
  .custom-grid {
    display: grid;
    grid-template-areas: "header" "main" "footer";
  }
</style>
```

---

## 6. Accessibility Requirements

### Semantic HTML

```astro
<!-- Good: Semantic elements -->
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<!-- Avoid: Generic divs -->
<div>
  <div>
    <div><a href="/">Home</a></div>
  </div>
</div>
```

### ARIA Attributes

```astro
<button
  type="button"
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  <span aria-hidden="true">×</span>
</button>
```

### Keyboard Navigation

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      handleClose();
      break;
    case 'Enter':
      handleSubmit();
      break;
  }
};
```

---

## 7. Props & Type Safety

### Interface Definition

```typescript
export interface ComponentProps {
  /** Required prop */
  title: string;
  
  /** Optional with default */
  variant?: 'default' | 'primary';
  
  /** Union types */
  size?: 'sm' | 'md' | 'lg';
  
  /** Complex types */
  items?: Array<{ id: string; label: string }>;
  
  /** Event handlers */
  onClick?: (event: MouseEvent) => void;
  
  /** Pass-through props */
  class?: string;
  [key: string]: any;
}
```

### Default Values

```astro
const {
  title,
  variant = 'default',
  size = 'md',
  items = [],
  class: className = '',
  ...rest
} = Astro.props;
```

---

## 8. Performance Optimization

### Image Components

Always use `OptimizedImage.astro`:
```astro
<OptimizedImage
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  formats={['avif', 'webp', 'jpeg']}
/>
```

### Lazy Loading

```astro
<Island client:visible>
  <HeavyComponent />
</Island>
```

### Code Splitting

```astro
<!-- Split large islands -->
<ChatWidget client:only="react" />

<!-- Not: -->
<div>
  <ChatWidget />
  <Dashboard />
  <Analytics />
</div>
```

---

## 9. Testing Components

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('component interaction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Action' }).click();
  await expect(page.getByText('Result')).toBeVisible();
});
```

---

## 10. Documentation

### Component Documentation

Every component should include:
1. **Purpose**: What it does
2. **Usage examples**: Basic and advanced
3. **Props documentation**: JSDoc for each prop
4. **Accessibility notes**: ARIA, keyboard, screen reader
5. **Related components**: Similar or complementary

### Inline Comments

```astro
<!-- Explain non-obvious logic -->
{/* React comment style */}

// Script comment style
```

---

## 11. Common Patterns

### Conditional Rendering

```astro
{title && <h2>{title}</h2>}
{items.length > 0 && <List items={items} />}
{isLoading ? <Spinner /> : <Content />}
```

### Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <Component />
</ErrorBoundary>
```

### State Management

```tsx
// Local state
const [value, setValue] = useState('');

// Derived state
const isValid = value.length > 0;

// Side effects
useEffect(() => {
  // Effect logic
}, [dependency]);
```

---

## Reference

- `docs/COMPONENT_DOCUMENTATION_GUIDE.md` - Detailed documentation standards
- `DESIGN_BEST_PRACTICES.md` - Design token usage
- `.github/instructions/design.instructions.md` - Styling guidelines
- Astro Components: https://docs.astro.build/en/core-concepts/astro-components/
