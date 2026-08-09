#!/usr/bin/env node
/**
 * Design-system lint gate.
 *
 * Enforces the maintainability boundary for reusable UI:
 * - no duplicate Finder-style "* 2.*" artifacts
 * - no raw hex colors outside token/config/migration files
 * - no undefined legacy token names
 * - no unsupported opacity suffixes
 * - no legacy component taxonomy imports
 * - no root-level component files outside the public barrel
 * - no stale component documentation paths/categories
 * - no stale decorative design-doc language
 * - no raw palette utilities in reusable components/runtime surfaces
 * - no hard-coded high elevation in primitives/composites
 * - no legacy shell escape patterns
 * - no direct Tailwind container shell usage in app surfaces
 * - no decorative blur orbs outside PageHero opt-in
 * - no BadgePill imports (use Badge variant="pill")
 * - no DIY elevated card shells when BaseCard is available
 * - no ad-hoc font-heading size ladders outside typeScale allowlist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = process.cwd();
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const IGNORED_DIRS = new Set([
  '.git',
  '.astro',
  '.playwright-mcp',
  'coverage',
  'dist',
  'lighthouse-reports',
  'node_modules',
  'optimization-reports',
  'test-results',
  'tmp',
]);

const SOURCE_EXTENSIONS = /\.(astro|tsx?|jsx?|css|mdx?)$/;
const DUPLICATE_COPY_REGEX = /(?:^|\/)[^/]+ 2\.[^/]+$/;
const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
const TOKEN_ALLOW_PATH =
  /(?:^|\/)(?:DESIGN_BEST_PRACTICES\.md)|design-best-practices|token|theme|migration/i;
const ARBITRARY_SPACING_PX_REGEX =
  /(?:^|\s)(?:-?m[trblxy]?|-?p[trblxy]?|gap[xy]?|space-[xy]|inset[xy]?|top|right|bottom|left)-\[[^\]\n]*?(-?\d+(?:\.\d+)?)px[^\]\n]*?\]/g;
const UNDEFINED_DESIGN_REGEX =
  /(?:from|via|to|bg|text|border|ring)-tertiary(?:-[\w/.[\]]+)?|var\(--color-(?:foreground-rgb|foreground-light-rgb)\)/g;
const UNSUPPORTED_OPACITY_REGEX = /\/(?:35|45)(?=[\s"'`}\]])/g;
const RAW_PALETTE_REGEX =
  /\b(?:text|bg|border|ring|from|via|to)-(?:gray|green|red|blue|yellow|amber|purple|pink|orange|emerald|rose|indigo|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?\b/g;
const RAW_WHITE_BLACK_REGEX =
  /\b(?:text-white|bg-white|border-white|ring-white|from-white|to-white|via-white|text-black|bg-black|border-black|ring-black|from-black|to-black|via-black)(?:\/\d+)?\b/g;
const PARALLEL_DARK_UTIL_REGEX =
  /\b(?:bg|text|border|from|via|to)-(?:background-dark|surface-dark|surface-dark-subtle|surface-elevated-dark|foreground-light|border-dark)(?:\/\d+)?\b/g;
const HARD_ELEVATION_REGEX = /(?<!-)(?:\bshadow-(?:xl|2xl)\b)|shadow-\[[^\]]+\]/g;
const HARD_RADIUS_REGEX = /\brounded-\[[^\]]+\]/g;
const SHELL_ESCAPE_REGEX = /-mt-24|-mx-4\s+sm:-mx-6\s+lg:-mx-8/g;
/** Contiguous page-padding ladders (px-4 + responsive px-*). */
const HARD_GUTTER_REGEX = /\bpx-4(?:\s+(?:sm|md|lg|xl|2xl):px-\d+)+\b/g;
/**
 * Near-miss ladders with intervening utilities (e.g. px-4 pb-8 sm:px-6 … lg:px-12).
 * Keep the window tight so component-local px-4 … md:px-2 pairs are less likely to false-positive.
 */
const HARD_GUTTER_NEAR_MISS_REGEX =
  /\bpx-4\b(?:(?!["'`\n])[\s\S]){0,100}?\b(?:sm|md|lg|xl|2xl):px-(?:6|8|10|12)\b/g;
const DIRECT_CONTAINER_REGEX = /\bcontainer\s+mx-auto\b/g;
/** Feature-owned overlay styles must not drift back into the shared stylesheet. */
const SHARED_FEATURE_SELECTOR_REGEX =
  /\.command-center\b|\.ai-chat-panel\b|\.ai-chat-launcher\b|#search-overlay\b|command-panel-in\b|chat-panel-in\b/g;
const LEGACY_COMPONENT_PATH_REGEX =
  /src\/components\/(?:chat|common|composite|config|debug|media|ui)\b|components\/(?:chat|common|composite|config|debug|media|ui)\b|\.\.\/(?:common|composite|media|ui)\//g;
const STALE_DECORATIVE_DOC_REGEX =
  /glass-morphism|glass morphism|Frosted Glass|Rotating Gradient|Pulse Scale|Continuous gradient|shadow animations|gradient overlay/g;
/** Decorative blur orbs / washes (rounded-full + heavy blur). */
const BLUR_ORB_REGEX =
  /(?:rounded-full[^\n"'`]{0,100}blur-(?:2xl|3xl)|blur-(?:2xl|3xl)[^\n"'`]{0,100}rounded-full)/g;
/** Prefer Badge variant="pill" — BadgePill is a deprecated thin wrapper. */
const BADGE_PILL_IMPORT_REGEX =
  /\bimport\s+BadgePill\b|from\s+['"][^'"]*BadgePill(?:\.astro)?['"]/g;
/** Elevated DIY cards that should use BaseCard. */
const DIY_ELEVATED_CARD_REGEX =
  /(?:rounded-(?:2xl|3xl)[^\n"'`]{0,160}shadow-(?:md|lg)|shadow-(?:md|lg)[^\n"'`]{0,160}rounded-(?:2xl|3xl))/g;
/** Ad-hoc heading ladders (2xl+) — prefer headingSizeClass / IntroCopy / SectionHeading. */
const RAW_HEADING_LADDER_REGEX =
  /font-heading[^\n"'`]{0,160}\b(?:sm:|md:|lg:|xl:)?text-(?:[2-7]xl)\b|\b(?:sm:|md:|lg:|xl:)?text-(?:[2-7]xl)\b[^\n"'`]{0,160}font-heading/g;

const allowedPx = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64]);
const allowedComponentRootFiles = new Set(['src/components/index.ts']);

/** Opt-in blur orbs only on PageHero (includeBlurOrbs). */
const blurOrbAllowPaths = new Set(['src/components/composites/PageHero.astro']);

const badgePillAllowPaths = new Set([
  'src/components/primitives/BadgePill.astro',
  'src/components/primitives/index.ts',
  'tests/vitest/primitives.test.ts',
]);

const diyElevatedAllowPaths = new Set([
  'src/components/primitives/BaseCard.astro',
  'src/components/composites/FeatureCard.astro',
  'src/components/composites/PhotoCarousel.astro',
]);

const headingLadderAllowPaths = new Set([
  'src/lib/typeScale.ts',
  'src/components/composites/IntroCopy.astro',
  'src/components/primitives/SectionHeading.astro',
  'src/components/primitives/Prose.astro',
]);

const reusableSurfacePaths = [
  'src/components',
  'src/features',
  'src/lib',
  'src/scripts',
  'src/pages/blog',
  'src/pages/design',
  'src/pages/docs',
  'src/pages/debug',
  'src/pages/projects',
  'src/pages/accessibility',
];

const elevationPolicyPaths = [
  'src/components/primitives',
  'src/components/composites',
  'src/components/features',
  'src/styles/components.css',
];

/** Blog MDX: same elevation/radius policy as components (≤ shadow-lg; no arbitrary radius). */
const mdxElevationPolicyPaths = ['src/content/blog'];

const findings = {
  duplicate: [],
  hex: [],
  spacing: [],
  undefined: [],
  opacity: [],
  taxonomy: [],
  componentRoot: [],
  docsLanguage: [],
  palette: [],
  elevation: [],
  radius: [],
  shell: [],
  gutter: [],
  container: [],
  featureOwnership: [],
  blurOrb: [],
  badgePill: [],
  diyCard: [],
  headingLadder: [],
};

function shouldIgnoreDir(name) {
  return IGNORED_DIRS.has(name);
}

function walkFiles(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) walkFiles(path.join(dir, entry.name), onFile);
      continue;
    }
    const file = path.join(dir, entry.name);
    onFile(file);
  }
}

function collectSourceFiles(startDir) {
  const files = [];
  walkFiles(path.join(root, startDir), (file) => {
    if (SOURCE_EXTENSIONS.test(file)) files.push(file);
  });
  return files;
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function isWithin(relPath, policyPaths) {
  return policyPaths.some(
    (policyPath) => relPath === policyPath || relPath.startsWith(`${policyPath}/`)
  );
}

function addRegexFindings(list, file, content, regex) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(content))) {
    list.push({ file, value: match[0] });
  }
}

function scanDuplicates() {
  walkFiles(root, (file) => {
    const relPath = rel(file);
    if (DUPLICATE_COPY_REGEX.test(relPath)) {
      findings.duplicate.push({ file: relPath, value: path.basename(relPath) });
    }
  });
}

function scanComponentRoot() {
  const componentsDir = path.join(root, 'src/components');
  if (!fs.existsSync(componentsDir)) return;

  const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const relPath = `src/components/${entry.name}`;
    if (!allowedComponentRootFiles.has(relPath)) {
      findings.componentRoot.push({
        file: relPath,
        value: 'move into layout, primitives, composites, features, or islands',
      });
    }
  }
}

function scanSourceFile(file) {
  const relPath = rel(file);
  const content = fs.readFileSync(file, 'utf8');

  if (relPath === 'src/styles/components.css') {
    addRegexFindings(findings.featureOwnership, relPath, content, SHARED_FEATURE_SELECTOR_REGEX);
  }

  if (!TOKEN_ALLOW_PATH.test(relPath)) {
    addRegexFindings(findings.hex, relPath, content, HEX_REGEX);
  }

  let spacingMatch;
  ARBITRARY_SPACING_PX_REGEX.lastIndex = 0;
  while ((spacingMatch = ARBITRARY_SPACING_PX_REGEX.exec(content))) {
    const value = Number(spacingMatch[1]);
    if (!allowedPx.has(value)) findings.spacing.push({ file: relPath, value: `${value}px` });
  }

  addRegexFindings(findings.undefined, relPath, content, UNDEFINED_DESIGN_REGEX);
  addRegexFindings(findings.opacity, relPath, content, UNSUPPORTED_OPACITY_REGEX);
  addRegexFindings(findings.taxonomy, relPath, content, LEGACY_COMPONENT_PATH_REGEX);

  if (
    relPath === 'src/data/componentDocs.ts' ||
    relPath.startsWith('src/data/component-docs/') ||
    relPath.startsWith('src/pages/design/') ||
    relPath.startsWith('src/pages/docs/')
  ) {
    addRegexFindings(findings.docsLanguage, relPath, content, STALE_DECORATIVE_DOC_REGEX);
  }

  if (isWithin(relPath, reusableSurfacePaths) && !TOKEN_ALLOW_PATH.test(relPath)) {
    addRegexFindings(findings.palette, relPath, content, RAW_PALETTE_REGEX);
    addRegexFindings(findings.palette, relPath, content, RAW_WHITE_BLACK_REGEX);
    addRegexFindings(findings.palette, relPath, content, PARALLEL_DARK_UTIL_REGEX);
  }

  if (isWithin(relPath, elevationPolicyPaths)) {
    addRegexFindings(findings.elevation, relPath, content, HARD_ELEVATION_REGEX);
    addRegexFindings(findings.radius, relPath, content, HARD_RADIUS_REGEX);
  }

  if (isWithin(relPath, mdxElevationPolicyPaths)) {
    addRegexFindings(findings.elevation, relPath, content, HARD_ELEVATION_REGEX);
    addRegexFindings(findings.radius, relPath, content, HARD_RADIUS_REGEX);
    addRegexFindings(findings.palette, relPath, content, RAW_WHITE_BLACK_REGEX);
  }

  if (
    (relPath.startsWith('src/components/') ||
      relPath.startsWith('src/content/blog/') ||
      relPath.startsWith('src/pages/')) &&
    !blurOrbAllowPaths.has(relPath)
  ) {
    addRegexFindings(findings.blurOrb, relPath, content, BLUR_ORB_REGEX);
  }

  if (!badgePillAllowPaths.has(relPath)) {
    addRegexFindings(findings.badgePill, relPath, content, BADGE_PILL_IMPORT_REGEX);
  }

  if (
    (relPath.startsWith('src/components/features/') ||
      relPath.startsWith('src/components/composites/')) &&
    !diyElevatedAllowPaths.has(relPath) &&
    !content.includes('BaseCard')
  ) {
    addRegexFindings(findings.diyCard, relPath, content, DIY_ELEVATED_CARD_REGEX);
  }

  if (
    (relPath.startsWith('src/components/') || relPath.startsWith('src/pages/')) &&
    !relPath.startsWith('src/pages/design/') &&
    !relPath.startsWith('src/pages/docs/') &&
    !relPath.startsWith('src/pages/debug/') &&
    !headingLadderAllowPaths.has(relPath)
  ) {
    addRegexFindings(findings.headingLadder, relPath, content, RAW_HEADING_LADDER_REGEX);
  }

  if (
    (relPath.startsWith('src/pages/') || relPath.startsWith('src/components/')) &&
    !relPath.startsWith('src/pages/design/') &&
    !relPath.startsWith('src/pages/docs/') &&
    !relPath.startsWith('src/pages/debug/') &&
    !relPath.startsWith('src/pages/accessibility/')
  ) {
    addRegexFindings(findings.shell, relPath, content, SHELL_ESCAPE_REGEX);
    addRegexFindings(findings.gutter, relPath, content, HARD_GUTTER_REGEX);
    addRegexFindings(findings.gutter, relPath, content, HARD_GUTTER_NEAR_MISS_REGEX);
    addRegexFindings(findings.container, relPath, content, DIRECT_CONTAINER_REGEX);
  }
}

/** Exported for Vitest synthetic escape fixtures (#374). */
export const DESIGN_LINT_GUTTER_PATTERNS = {
  HARD_GUTTER_REGEX,
  HARD_GUTTER_NEAR_MISS_REGEX,
  SHARED_FEATURE_SELECTOR_REGEX,
};

function printFindings(title, list, limit = 50) {
  if (!list.length) return;
  console.log(`\n[design-lint] ${title}:`);
  list.slice(0, limit).forEach((finding) => {
    console.log(`  ${finding.file} -> ${finding.value}`);
  });
  if (list.length > limit) console.log(`  ... +${list.length - limit} more`);
}

if (isDirectRun) {
  scanDuplicates();
  scanComponentRoot();
  collectSourceFiles('src').forEach(scanSourceFile);

  printFindings('Duplicate artifact files detected', findings.duplicate);
  printFindings('Raw hex colors detected outside token files', findings.hex);
  printFindings('Suspicious arbitrary pixel spacing detected', findings.spacing);
  printFindings('Undefined design tokens/utilities detected', findings.undefined);
  printFindings('Unsupported opacity suffixes detected', findings.opacity);
  printFindings('Legacy component taxonomy references detected', findings.taxonomy);
  printFindings('Root-level component files detected', findings.componentRoot);
  printFindings('Stale decorative design documentation detected', findings.docsLanguage);
  printFindings('Raw palette utilities detected in reusable surfaces', findings.palette);
  printFindings(
    'Hard-coded high elevation detected in primitives/composites/features',
    findings.elevation
  );
  printFindings(
    'Hard-coded arbitrary radius detected in primitives/composites/features/MDX',
    findings.radius
  );
  printFindings('Legacy shell escape patterns detected', findings.shell);
  printFindings(
    'Hard-coded page gutters detected (use layout-gutter or Container)',
    findings.gutter
  );
  printFindings('Direct container shell usage detected', findings.container);
  printFindings(
    'Feature-specific selectors detected in shared stylesheet',
    findings.featureOwnership
  );
  printFindings(
    'Decorative blur orbs detected (use PageHero includeBlurOrbs or remove)',
    findings.blurOrb
  );
  printFindings('BadgePill imports detected (use Badge variant="pill")', findings.badgePill);
  printFindings('DIY elevated card shells detected (prefer BaseCard)', findings.diyCard);
  printFindings(
    'Ad-hoc heading ladders detected (use typeScale / IntroCopy / SectionHeading)',
    findings.headingLadder
  );

  const issueCount = Object.values(findings).reduce((count, list) => count + list.length, 0);

  if (issueCount === 0) {
    console.log('[design-lint] No issues found.');
    process.exit(0);
  }

  process.exit(1);
}
