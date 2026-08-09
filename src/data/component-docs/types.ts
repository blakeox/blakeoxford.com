/**
 * Component documentation types and authoring checklist.
 */

import type { ComponentVisualBaselineKey } from '@/data/componentVisualBaselines';
import { PRIMITIVE_PROP_CONTRACT } from '@/data/primitivePropContract';

export type ComponentProp = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
};

export type ComponentExample = {
  title: string;
  code: string;
  description?: string;
};

export type VisualTier = 'quiet' | 'elevated' | 'expressive';

export type ComponentDoc = {
  name: string;
  category: 'Layout' | 'Features' | 'Islands' | 'Primitives' | 'Composites';
  subcategory?: string;
  description: string;
  filePath: string;
  props?: ComponentProp[];
  examples?: ComponentExample[];
  accessibility?: string[];
  performance?: string[];
  tags?: string[];
  /** Visual weight tier from /design/patterns — quiet (static), elevated (interactive cards), expressive (hero/modal) */
  visualTier?: VisualTier;
  /** CSS custom properties and semantic utilities this component depends on */
  tokenDependencies?: string[];
  /** Key into componentVisualBaselines.ts for Playwright snapshot coverage */
  visualBaseline?: ComponentVisualBaselineKey;
};

export type ComponentRecipeReference = {
  recipe:
    | 'baseCardRecipe'
    | 'baseCardRecipe.hover'
    | 'baseCardRecipe.padding'
    | 'badgeRecipe.variant'
    | 'badgeRecipe.size'
    | 'buttonRecipe.variant'
    | 'buttonRecipe.size'
    | 'containerRecipe.size'
    | 'featureCardRecipe.variant'
    | 'proseRecipe.size'
    | 'sectionRecipe.padding'
    | 'sectionRecipe.background';
  keys: readonly string[];
};

export type ComponentManifestEntry = ComponentDoc & {
  accessibilityRequirements: readonly string[];
  recipeReferences?: readonly ComponentRecipeReference[];
};

/** Checklist for authoring new components — surfaced on /design/components */
export const COMPONENT_AUTHORING_CHECKLIST = [
  'Place the file in the correct layer folder (primitives, composites, features, layout, islands).',
  'Expose standard props when applicable: variant, size, class, as, data-testid (see PRIMITIVE_PROP_CONTRACT).',
  'Document props and examples in this catalog — category must match the folder path.',
  'Declare visualTier and tokenDependencies for surfaces that consume design tokens.',
  'Link visualBaseline when a Playwright snapshot exists in componentVisualBaselines.ts.',
  'Use semantic token utilities only — no raw palette names in reusable components.',
  'Include accessibility notes (focus, landmarks, ARIA) for interactive components.',
] as const;

export { PRIMITIVE_PROP_CONTRACT };
