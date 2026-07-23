/**
 * Complete component documentation catalog (order preserved from legacy componentDocs.ts).
 */

import type { ComponentDoc } from './types';
import { layoutDocs } from './layout';
import { featureDocs } from './features';
import { compositeDocs } from './composites';
import { primitiveDocs } from './primitives';
import { islandChatDocs } from './islands-chat';
import { islandContactDocs } from './islands-contact';
import { islandScriptDocs } from './islands-scripts';

const byName = new Map<string, ComponentDoc>();
for (const doc of [
  ...layoutDocs,
  ...featureDocs,
  ...compositeDocs,
  ...primitiveDocs,
  ...islandChatDocs,
  ...islandContactDocs,
  ...islandScriptDocs,
]) {
  byName.set(doc.name, doc);
}

/** Canonical order matching the pre-split catalog */
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

export const componentDocs: ComponentDoc[] = CATALOG_ORDER.map((name) => {
  const doc = byName.get(name);
  if (!doc) {
    throw new Error(`Missing component doc for ${name}`);
  }
  return doc;
});
