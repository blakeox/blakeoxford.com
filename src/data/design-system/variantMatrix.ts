/**
 * Generated canonical coverage cases for public recipe keys.
 *
 * The matrix is intentionally bounded: recipe keys are covered once per declared component
 * contract, while themes and viewports are metadata for the owning visual/accessibility checks.
 */
import { componentManifest } from '@/data/component-docs/manifest';
import type { ComponentRecipeReference } from '@/data/component-docs/types';

export type VariantCoverage = 'visual' | 'structural';
export type VariantTheme = 'light' | 'dark';
export type VariantViewport = 'desktop' | 'mobile';

export type ComponentVariantCase = {
  id: string;
  component: string;
  recipe: ComponentRecipeReference['recipe'];
  variant: string;
  coverage: VariantCoverage;
  themes: readonly VariantTheme[];
  viewports: readonly VariantViewport[];
  visualSurface?: '/design/components/';
};

const coverageByRecipe: Record<ComponentRecipeReference['recipe'], VariantCoverage> = {
  baseCardRecipe: 'visual',
  'baseCardRecipe.hover': 'visual',
  'baseCardRecipe.padding': 'structural',
  'badgeRecipe.variant': 'visual',
  'badgeRecipe.size': 'structural',
  'buttonRecipe.variant': 'visual',
  'buttonRecipe.size': 'structural',
  'containerRecipe.size': 'structural',
  'featureCardRecipe.variant': 'visual',
  'proseRecipe.size': 'structural',
  'sectionRecipe.padding': 'structural',
  'sectionRecipe.background': 'visual',
};

export const componentVariantMatrix: ComponentVariantCase[] = componentManifest.flatMap((doc) =>
  (doc.recipeReferences ?? []).flatMap((reference) =>
    reference.keys.map((variant) => {
      const coverage = coverageByRecipe[reference.recipe];
      return {
        id: `${doc.name}:${reference.recipe}:${variant}`,
        component: doc.name,
        recipe: reference.recipe,
        variant,
        coverage,
        themes: ['light', 'dark'] as const,
        viewports: ['desktop', 'mobile'] as const,
        ...(coverage === 'visual' ? { visualSurface: '/design/components/' as const } : {}),
      };
    })
  )
);

export function getComponentVariantCases(component: string): ComponentVariantCase[] {
  return componentVariantMatrix.filter((entry) => entry.component === component);
}

export function getVisualVariantCases(): ComponentVariantCase[] {
  return componentVariantMatrix.filter((entry) => entry.coverage === 'visual');
}
