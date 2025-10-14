# Component Documentation Guide

This guide establishes standards for documenting components in the Blake Oxford Portfolio codebase.

---

## Documentation Standards

### Required Elements for All Components

1. **Component Header Comment**: JSDoc block describing purpose and usage
2. **Props Interface**: TypeScript interface with JSDoc comments for each prop
3. **Usage Examples**: At least one basic example in the header comment
4. **Accessibility Notes**: Document ARIA attributes, keyboard navigation, focus management
5. **Related Components**: Link to similar or complementary components

---

## Documentation Template

### Primitive Components

```astro
---
/**
 * ComponentName - Brief one-line description
 * 
 * Longer description explaining the component's purpose, when to use it,
 * and any important behavioral notes.
 * 
 * @example Basic usage
 * <ComponentName variant="primary" size="md">
 *   Content here
 * </ComponentName>
 * 
 * @example With custom styling
 * <ComponentName 
 *   variant="ghost" 
 *   size="lg"
 *   class="custom-class"
 * >
 *   Content here
 * </ComponentName>
 * 
 * @accessibility
 * - Uses semantic HTML element
 * - Includes focus-visible styles for keyboard navigation
 * - Supports screen reader announcements via aria-label
 * 
 * @related
 * - OtherComponent: For alternate use case
 * - ComplementaryComponent: Often used together
 */

export interface Props {
  /** Primary visual variant affecting color and style */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  
  /** Size variant affecting padding and font-size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes to apply */
  class?: string;
  
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

const {
  variant = 'default',
  size = 'md',
  class: className = '',
  ...rest
} = Astro.props;
---

<!-- Component implementation -->
```

### Composite Components

```astro
---
/**
 * CompositeComponentName - Brief description
 * 
 * Composite component built from primitives: List, Badge, Button, etc.
 * Use when you need [specific use case].
 * 
 * @example Basic usage
 * <CompositeComponentName 
 *   title="Feature Title"
 *   description="Description text"
 * />
 * 
 * @example With slots
 * <CompositeComponentName title="Title">
 *   <div slot="header">Custom Header</div>
 *   <p>Default slot content</p>
 *   <div slot="footer">Custom Footer</div>
 * </CompositeComponentName>
 * 
 * @composition
 * - Uses Stack primitive for vertical layout
 * - Uses Badge for visual indicators
 * - Uses Button for actions
 * 
 * @accessibility
 * - Semantic heading hierarchy (h2 by default)
 * - Keyboard navigable actions
 * - ARIA labels for icon-only buttons
 * 
 * @related
 * - Stack: Layout primitive used internally
 * - Badge: For status indicators
 */

export interface Props {
  /** Component title (required) */
  title: string;
  
  /** Optional description text */
  description?: string;
  
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'glass';
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  class?: string;
}

const {
  title,
  description,
  variant = 'default',
  size = 'md',
  class: className = '',
  ...rest
} = Astro.props;
---

<!-- Component implementation -->
```

### Feature Components

```astro
---
/**
 * FeatureComponentName - Domain-specific component
 * 
 * Feature component for [specific feature area like blog, projects, etc.].
 * Combines multiple primitives and composites for complete functionality.
 * 
 * @example Standard usage
 * <FeatureComponentName 
 *   data={collectionEntry}
 *   variant="card"
 * />
 * 
 * @example Custom configuration
 * <FeatureComponentName 
 *   data={collectionEntry}
 *   showTags={true}
 *   maxTags={5}
 *   variant="compact"
 * />
 * 
 * @props
 * - data: Content collection entry (required)
 * - showTags: Display tag list (default: true)
 * - maxTags: Maximum tags to show (default: 3)
 * 
 * @dependencies
 * - Requires content collection entry type
 * - Uses formatDateISO utility
 * - Imports Badge, Button, Stack primitives
 * 
 * @accessibility
 * - Article landmark for semantic structure
 * - Time element with datetime attribute
 * - Focus trap for interactive elements
 * - Keyboard navigation support
 * 
 * @performance
 * - Static rendering (no client JS)
 * - Lazy loads images via OptimizedImage
 * - Minimal CSS payload
 */

import type { CollectionEntry } from 'astro:content';
import { formatDateISO } from '../../../utils/index.js';

export interface Props {
  /** Content collection entry */
  data: CollectionEntry<'blog'>;
  
  /** Show tag list */
  showTags?: boolean;
  
  /** Maximum tags to display */
  maxTags?: number;
  
  /** Visual variant */
  variant?: 'card' | 'compact' | 'featured';
}

// Component implementation
---
```

---

## JSDoc Standards

### Props Documentation

Each prop must include:

1. **Description**: Clear explanation of purpose and usage
2. **Type**: Explicit type annotation (handled by TypeScript)
3. **Default**: Default value if optional
4. **Examples**: For complex props, show example values

```typescript
export interface Props {
  /** 
   * Visual variant affecting appearance
   * @default 'default'
   * @example variant="primary" // Blue accent color
   * @example variant="ghost" // Transparent background
   */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  
  /**
   * Size variant controlling dimensions and text size
   * - sm: Compact sizing (32px height, text-sm)
   * - md: Standard sizing (40px height, text-base)
   * - lg: Large sizing (48px height, text-lg)
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}
```

### Method Documentation (TypeScript/React)

```typescript
/**
 * Initialize the component and set up event listeners
 * 
 * @param options - Configuration options
 * @param options.autoPlay - Start playing automatically
 * @param options.interval - Milliseconds between transitions
 * @returns Cleanup function to remove listeners
 * 
 * @example
 * const cleanup = initialize({ autoPlay: true, interval: 5000 });
 * // Later...
 * cleanup();
 */
function initialize(options: InitOptions): () => void {
  // Implementation
}
```

---

## Accessibility Documentation

### Required Sections

1. **Keyboard Navigation**: Document all keyboard interactions
2. **Screen Reader Support**: Explain ARIA attributes and announcements
3. **Focus Management**: Describe focus behavior and visual indicators
4. **Color Contrast**: Note if custom contrast checking is needed

### Example

```astro
/**
 * @accessibility
 * 
 * Keyboard Navigation:
 * - Tab: Move focus to button
 * - Enter/Space: Activate button
 * - Escape: Close modal (if applicable)
 * 
 * Screen Reader Support:
 * - aria-label provides context for icon-only buttons
 * - aria-pressed indicates toggle state
 * - Live region announces state changes
 * 
 * Focus Management:
 * - focus-visible styles for keyboard users
 * - Focus trap when modal opens
 * - Focus returns to trigger on close
 * 
 * Color Contrast:
 * - All variants meet WCAG AA (4.5:1 minimum)
 * - Dark mode variants independently tested
 * - Test with tools: axe DevTools, WAVE
 */
```

---

## Component Categories

### Primitives (src/components/primitives/)

Low-level building blocks with minimal logic:

- Badge, Button, Flex, Stack, Grid, Container
- DateDisplay, Section, BadgePill, GradientOverlay

**Documentation Focus**:
- Prop variants and their visual effects
- Layout behavior (flexbox, grid)
- Composition patterns

### Composites (src/components/composites/)

Mid-level components built from primitives:

- Card, StatsCard, FeatureItem, FeatureGrid
- ButtonGroup, Hero

**Documentation Focus**:
- Primitive composition
- Slot usage patterns
- Common use cases

### Features (src/components/features/)

Domain-specific components for content:

- BlogPostCard, ProjectCard, EducationCard
- ExperienceCard, AchievementCard

**Documentation Focus**:
- Content collection integration
- Data transformation
- Feature-specific behavior

### UI Components (src/components/ui/)

Specialized interactive components:

- OptimizedImage, CoinFlipImage, PhotoCarousel
- SearchOverlay, ThemeToggle

**Documentation Focus**:
- Client-side interactivity
- Performance optimization
- Browser API usage

---

## Documentation Workflow

### Adding Documentation to Existing Components

1. **Read Component**: Understand current implementation
2. **Identify Gaps**: Check for missing props documentation, examples
3. **Add Header Comment**: Comprehensive JSDoc with examples
4. **Document Props**: Add JSDoc to each interface property
5. **Add Accessibility Notes**: Document keyboard, screen reader, focus
6. **Create Examples**: Minimum 2 examples (basic + advanced)
7. **Test Examples**: Verify examples work in actual usage

### Creating New Documented Components

1. **Start with Template**: Use appropriate template from this guide
2. **Define Interface First**: Props with full JSDoc comments
3. **Write Examples**: Before implementation, write usage examples
4. **Implement**: Build component following documented behavior
5. **Test**: Verify component matches documentation
6. **Update Tests**: Add tests validating documented behavior

---

## Examples Library

Common documentation patterns:

### Variant Props

```typescript
/**
 * Visual style variant
 * 
 * Variants:
 * - default: Standard styling with subtle background
 * - primary: Prominent accent color for CTAs
 * - secondary: Muted styling for supporting actions
 * - ghost: Transparent background, minimal styling
 * - danger: Red accent for destructive actions
 * 
 * @default 'default'
 */
variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
```

### Size Props

```typescript
/**
 * Component size affecting dimensions and typography
 * 
 * Size Scale:
 * - xs: 24px height, text-xs (extra compact)
 * - sm: 32px height, text-sm (compact)
 * - md: 40px height, text-base (standard)
 * - lg: 48px height, text-lg (prominent)
 * - xl: 56px height, text-xl (hero)
 * 
 * @default 'md'
 */
size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### Boolean Props

```typescript
/**
 * Enable full-width layout spanning container
 * When true, removes max-width constraint
 * @default false
 */
fullWidth?: boolean;

/**
 * Disable interactive state (non-clickable, grayed out)
 * Adds aria-disabled and removes hover effects
 * @default false
 */
disabled?: boolean;
```

### Complex Object Props

```typescript
/**
 * Image configuration object
 * 
 * @example
 * image={{
 *   src: '/images/hero.jpg',
 *   alt: 'Hero image description',
 *   width: 1200,
 *   height: 630
 * }}
 */
image?: {
  /** Image source path (relative or absolute URL) */
  src: string;
  
  /** Accessible image description (required for a11y) */
  alt: string;
  
  /** Image width in pixels (for aspect ratio) */
  width?: number;
  
  /** Image height in pixels (for aspect ratio) */
  height?: number;
  
  /** Lazy loading strategy */
  loading?: 'lazy' | 'eager';
};
```

### Slot Documentation

```astro
/**
 * @slots
 * 
 * Default:
 * - Main content area
 * - Supports any HTML or components
 * 
 * header (optional):
 * - Custom header content
 * - Replaces default title/icon
 * - Example: <div slot="header">Custom Header</div>
 * 
 * footer (optional):
 * - Actions or metadata below main content
 * - Commonly used for buttons, links
 * - Example: <div slot="footer"><Button>Action</Button></div>
 * 
 * aside (optional):
 * - Sidebar or supplementary content
 * - Positioned based on layout variant
 */
```

---

## Maintenance

### Keeping Documentation Current

1. **Update with Code Changes**: Documentation changes must accompany code changes
2. **Review in PRs**: Check for documentation updates in pull requests
3. **Test Examples**: Validate examples still work after changes
4. **Version Notes**: Add `@since` tags for new features

### Deprecation

```typescript
/**
 * @deprecated Use `newProp` instead. Will be removed in v3.0.0
 * @see newProp
 */
oldProp?: string;
```

---

## Tools & Resources

### Documentation Tools

- **TypeScript**: Provides type checking for prop interfaces
- **ESLint**: Enforces JSDoc comment style
- **VS Code**: IntelliSense shows JSDoc in autocomplete
- **Astro Language Server**: Validates Astro syntax

### Accessibility Testing

- **axe DevTools**: Browser extension for accessibility scanning
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Automated accessibility audit
- **NVDA/JAWS**: Screen reader testing

### References

- [TSDoc Standard](https://tsdoc.org/): TypeScript documentation comments
- [JSDoc](https://jsdoc.app/): JavaScript documentation
- [Astro Docs](https://docs.astro.build): Framework reference
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/): Accessibility guidelines

---

## Quality Checklist

Before committing documented components:

- [ ] Header comment with description and examples
- [ ] All props have JSDoc comments
- [ ] At least 2 usage examples provided
- [ ] Accessibility section complete
- [ ] Related components linked
- [ ] Examples tested and working
- [ ] TypeScript types complete
- [ ] No ESLint errors
- [ ] Component appears in relevant index files
- [ ] Tests reference documentation

---

**Last Updated**: Phase 38 - October 14, 2025  
**Maintainer**: Blake Oxford  
**Related Docs**: CONTRIBUTING.md, DESIGN_BEST_PRACTICES.md
