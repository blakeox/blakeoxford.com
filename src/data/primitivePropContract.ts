/**
 * Standard prop surface for Astro primitives and composites.
 * Used by the component catalog and design-system authoring checklist.
 */

export type PrimitivePropName = 'variant' | 'size' | 'class' | 'as' | 'data-testid';

export type PrimitivePropContractEntry = {
  prop: PrimitivePropName;
  when: string;
  notes?: string;
};

/** Props every interactive or styled primitive should expose when applicable */
export const PRIMITIVE_PROP_CONTRACT: PrimitivePropContractEntry[] = [
  {
    prop: 'variant',
    when: 'Component has multiple visual surfaces or semantic states',
    notes: 'Use token-backed names only — no raw palette utilities in variants',
  },
  {
    prop: 'size',
    when: 'Component controls touch targets or typography scale',
    notes: 'Prefer sm | md | lg to match Button and Badge',
  },
  {
    prop: 'class',
    when: 'Always',
    notes: 'Astro prop name is `class`, not `className`',
  },
  {
    prop: 'as',
    when: 'Default element is insufficient for semantics (article, section, nav, etc.)',
  },
  {
    prop: 'data-testid',
    when: 'Interactive primitive or high-traffic control (Button, links, toggles)',
    notes: 'Stable selector for Playwright — avoid coupling tests to copy or CSS classes',
  },
];

export const PRIMITIVE_PROP_NAMES: PrimitivePropName[] = PRIMITIVE_PROP_CONTRACT.map(
  (entry) => entry.prop,
);
