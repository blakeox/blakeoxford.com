/**
 * Typed component manifest — the shared source for design documentation and quality checks.
 *
 * Component metadata remains authored in small category modules, while this manifest owns
 * canonical order, cross-cutting recipe references, and the fields consumed by documentation.
 * It intentionally stores token names and recipe keys, never CSS values.
 */

import { componentVisualBaselines } from '@/data/componentVisualBaselines';
import {
  badgeRecipe,
  baseCardRecipe,
  buttonRecipe,
  containerRecipe,
  featureCardRecipe,
  proseRecipe,
  sectionRecipe,
} from '@/lib/design-system/recipes';
import type { ComponentDoc, ComponentManifestEntry, ComponentRecipeReference } from './types';
import { compositeDocs } from './composites';
import { featureDocs } from './features';
import { islandChatDocs } from './islands-chat';
import { islandContactDocs } from './islands-contact';
import { islandScriptDocs } from './islands-scripts';
import { layoutDocs } from './layout';
import { primitiveDocs } from './primitives';

const sourceDocs = [
  ...layoutDocs,
  ...featureDocs,
  ...compositeDocs,
  ...primitiveDocs,
  ...islandChatDocs,
  ...islandContactDocs,
  ...islandScriptDocs,
];

const sourceNames = sourceDocs.map((doc) => doc.name);
const duplicateSourceNames = sourceNames.filter(
  (name, index) => sourceNames.indexOf(name) !== index
);
if (duplicateSourceNames.length > 0) {
  throw new Error(
    `Duplicate component documentation names: ${[...new Set(duplicateSourceNames)].join(', ')}`
  );
}

const byName = new Map<string, ComponentDoc>();
for (const doc of sourceDocs) {
  byName.set(doc.name, doc);
}

const CATALOG_ORDER = [
  'NavBar',
  'Footer',
  'ProjectCard',
  'SearchOverlay',
  'AIChatWidget',
  'AboutTimelineSection',
  'ContactChannels',
  'PhotoCarousel',
  'CoinFlipImage',
  'OptimizedImage',
  'Nav enhancement scripts',
  'MessageContent',
  'MessageSources',
  'MessageActions',
  'MessageCTAs',
  'Badge',
  'Button',
  'Container',
  'Prose',
  'Flex',
  'Grid',
  'Section',
  'FormField',
  'BaseCard',
  'Stack',
  'FeatureCard',
  'SectionHeading',
  'SkipLink',
  'PageHero',
  'CTASection',
  'SectionHeader',
  'CtaBand',
  'IntroCopy',
  'DotMetaList',
  'EditorialList',
  'MetricsTable',
  'ButtonGroup',
  'HomeHeroSection',
  'HomeHeroCopy',
  'HomeHeroVisual',
  'HomeCTASection',
  'HomeRecentProjectsSection',
  'HomeLatestPostsSection',
  'BlogIndexHeroSection',
  'ProjectHero',
  'ProjectDetailContent',
  'AboutHeroSection',
  'ContactHeroSection',
  'ContactMessageSection',
  'ContactFormIsland',
  'AIChatIsland',
  'Theme FOUC script',
] as const;

const catalogNames = new Set<string>(CATALOG_ORDER);
const undocumentedSourceNames = sourceNames.filter((name) => !catalogNames.has(name));
if (undocumentedSourceNames.length > 0) {
  throw new Error(
    `Component documentation is missing from CATALOG_ORDER: ${undocumentedSourceNames.join(', ')}`
  );
}

if (catalogNames.size !== CATALOG_ORDER.length) {
  throw new Error('CATALOG_ORDER contains duplicate component names');
}

const recipeReferences: Record<string, readonly ComponentRecipeReference[]> = {
  BaseCard: [
    { recipe: 'baseCardRecipe', keys: Object.keys(baseCardRecipe.variants.variant) },
    { recipe: 'baseCardRecipe.hover', keys: Object.keys(baseCardRecipe.variants.hover) },
    { recipe: 'baseCardRecipe.padding', keys: Object.keys(baseCardRecipe.variants.padding) },
  ],
  Badge: [
    { recipe: 'badgeRecipe.variant', keys: Object.keys(badgeRecipe.variants) },
    { recipe: 'badgeRecipe.size', keys: Object.keys(badgeRecipe.sizes) },
  ],
  Button: [
    { recipe: 'buttonRecipe.variant', keys: Object.keys(buttonRecipe.variants) },
    { recipe: 'buttonRecipe.size', keys: Object.keys(buttonRecipe.sizes) },
  ],
  Container: [{ recipe: 'containerRecipe.size', keys: Object.keys(containerRecipe.sizes) }],
  FeatureCard: [
    { recipe: 'featureCardRecipe.variant', keys: Object.keys(featureCardRecipe.variants) },
  ],
  Prose: [{ recipe: 'proseRecipe.size', keys: Object.keys(proseRecipe.sizes) }],
  Section: [
    { recipe: 'sectionRecipe.padding', keys: Object.keys(sectionRecipe.padding) },
    { recipe: 'sectionRecipe.background', keys: Object.keys(sectionRecipe.background) },
  ],
};

export const componentManifest: ComponentManifestEntry[] = CATALOG_ORDER.map((name) => {
  const doc = byName.get(name);
  if (!doc) throw new Error(`Missing component manifest entry for ${name}`);

  return {
    ...doc,
    accessibilityRequirements: doc.accessibility ?? [],
    ...(recipeReferences[name] ? { recipeReferences: recipeReferences[name] } : {}),
  };
});

/** Runtime reference used by manifest validation tests and documentation tooling. */
export const componentManifestBaselineKeys = new Set(Object.keys(componentVisualBaselines));
