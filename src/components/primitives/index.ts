/**
 * Primitives - Low-level reusable components
 * 
 * These are the building blocks for more complex components.
 * They provide consistent styling, behavior, and accessibility.
 * 
 * Categories:
 * - UI: BaseCard, Badge, Button, DateDisplay
 * - Forms: FormField
 * - Layout: Container, Stack, Section
 * 
 * @example
 * import { BaseCard, Badge, Button, DateDisplay, FormField, Container, Stack, Section } from '../primitives';
 */

// UI Components
export { default as BaseCard } from './BaseCard.astro';
export { default as Badge } from './Badge.astro';
export { default as Button } from './Button.astro';
export { default as DateDisplay } from './DateDisplay.astro';

// Form Components
export { default as FormField } from './FormField.astro';

// Layout Components
export { default as Container } from './Container.astro';
export { default as Stack } from './Stack.astro';
export { default as Section } from './Section.astro';
