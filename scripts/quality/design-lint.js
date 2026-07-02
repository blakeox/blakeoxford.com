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
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

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
const TOKEN_ALLOW_PATH = /(?:^|\/)(?:tailwind\.config\.ts|DESIGN_BEST_PRACTICES\.md)|design-best-practices|token|theme|migration/i;
const ARBITRARY_SPACING_PX_REGEX =
  /(?:^|\s)(?:-?m[trblxy]?|-?p[trblxy]?|gap[xy]?|space-[xy]|inset[xy]?|top|right|bottom|left)-\[[^\]\n]*?(-?\d+(?:\.\d+)?)px[^\]\n]*?\]/g;
const UNDEFINED_DESIGN_REGEX =
  /(?:from|via|to|bg|text|border|ring)-tertiary(?:-[\w/.[\]]+)?|var\(--color-(?:border|foreground-rgb|foreground-light-rgb)\)/g;
const UNSUPPORTED_OPACITY_REGEX = /\/(?:35|45)(?=[\s"'`}\]])/g;
const RAW_PALETTE_REGEX =
  /\b(?:text|bg|border|ring|from|via|to)-(?:gray|green|red|blue|yellow|amber|purple|pink|orange|emerald|rose|indigo|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?\b/g;
const RAW_WHITE_BLACK_REGEX = /\b(?:text-white|bg-white|border-white|ring-white|from-white|to-white|via-white|text-black|bg-black|border-black|ring-black|from-black|to-black|via-black)(?:\/\d+)?\b/g;
const HARD_ELEVATION_REGEX = /\bshadow-(?:xl|2xl)\b|shadow-\[[^\]]+\]/g;
const HARD_RADIUS_REGEX = /\brounded-\[[^\]]+\]/g;
const SHELL_ESCAPE_REGEX = /-mt-24|-mx-4\s+sm:-mx-6\s+lg:-mx-8/g;
const DIRECT_CONTAINER_REGEX = /\bcontainer\s+mx-auto\b/g;
const LEGACY_COMPONENT_PATH_REGEX = /src\/components\/(?:chat|common|composite|config|debug|media|ui)\b|components\/(?:chat|common|composite|config|debug|media|ui)\b|\.\.\/(?:common|composite|media|ui)\//g;
const COMPONENT_DOC_ENTRY_REGEX =
  /^  {\s*\n\s{4}name:\s*'([^']+)'[\s\S]*?\n\s{4}category:\s*'([^']+)'[\s\S]*?\n\s{4}filePath:\s*'([^']+)'/gm;
const STALE_DECORATIVE_DOC_REGEX =
  /glass-morphism|glass morphism|Frosted Glass|Rotating Gradient|Pulse Scale|Continuous gradient|shadow animations|gradient overlay/g;

const allowedPx = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64]);
const allowedComponentRootFiles = new Set(['src/components/index.ts']);

const reusableSurfacePaths = [
  'src/components',
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
  'src/styles/components.css',
];

const findings = {
  duplicate: [],
  hex: [],
  spacing: [],
  undefined: [],
  opacity: [],
  taxonomy: [],
  componentRoot: [],
  componentDocs: [],
  docsLanguage: [],
  palette: [],
  elevation: [],
  radius: [],
  shell: [],
  container: [],
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
  return policyPaths.some((policyPath) => relPath === policyPath || relPath.startsWith(`${policyPath}/`));
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

function expectedComponentCategory(filePath) {
  if (filePath.startsWith('src/components/layout/')) return 'Layout';
  if (filePath.startsWith('src/components/features/')) return 'Features';
  if (filePath.startsWith('src/components/islands/')) return 'Islands';
  if (filePath.startsWith('src/components/primitives/')) return 'Primitives';
  if (filePath.startsWith('src/components/composites/')) return 'Composites';
  return null;
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

function scanComponentDocs() {
  const docsPath = path.join(root, 'src/data/componentDocs.ts');
  if (!fs.existsSync(docsPath)) return;

  const content = fs.readFileSync(docsPath, 'utf8');
  const seenNames = new Set();
  COMPONENT_DOC_ENTRY_REGEX.lastIndex = 0;
  let match;

  while ((match = COMPONENT_DOC_ENTRY_REGEX.exec(content))) {
    const [, name, category, filePath] = match;
    const absoluteFilePath = path.join(root, filePath);
    const expectedCategory = expectedComponentCategory(filePath);

    if (seenNames.has(name)) {
      findings.componentDocs.push({
        file: 'src/data/componentDocs.ts',
        value: `${name}: duplicate component doc name`,
      });
    }
    seenNames.add(name);

    if (!fs.existsSync(absoluteFilePath)) {
      findings.componentDocs.push({
        file: 'src/data/componentDocs.ts',
        value: `${name}: missing ${filePath}`,
      });
    }

    if (!expectedCategory) {
      findings.componentDocs.push({
        file: 'src/data/componentDocs.ts',
        value: `${name}: non-canonical component path ${filePath}`,
      });
      continue;
    }

    if (category !== expectedCategory) {
      findings.componentDocs.push({
        file: 'src/data/componentDocs.ts',
        value: `${name}: category ${category} should be ${expectedCategory} for ${filePath}`,
      });
    }
  }
}

function scanSourceFile(file) {
  const relPath = rel(file);
  const content = fs.readFileSync(file, 'utf8');

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
    relPath.startsWith('src/pages/design/') ||
    relPath.startsWith('src/pages/docs/')
  ) {
    addRegexFindings(findings.docsLanguage, relPath, content, STALE_DECORATIVE_DOC_REGEX);
  }

  if (isWithin(relPath, reusableSurfacePaths) && !TOKEN_ALLOW_PATH.test(relPath)) {
    addRegexFindings(findings.palette, relPath, content, RAW_PALETTE_REGEX);
    addRegexFindings(findings.palette, relPath, content, RAW_WHITE_BLACK_REGEX);
  }

  if (isWithin(relPath, elevationPolicyPaths)) {
    addRegexFindings(findings.elevation, relPath, content, HARD_ELEVATION_REGEX);
    addRegexFindings(findings.radius, relPath, content, HARD_RADIUS_REGEX);
  }

  if (
    (relPath.startsWith('src/pages/') || relPath.startsWith('src/components/')) &&
    !relPath.startsWith('src/pages/design/') &&
    !relPath.startsWith('src/pages/docs/') &&
    !relPath.startsWith('src/pages/debug/') &&
    !relPath.startsWith('src/pages/accessibility/')
  ) {
    addRegexFindings(findings.shell, relPath, content, SHELL_ESCAPE_REGEX);
    addRegexFindings(findings.container, relPath, content, DIRECT_CONTAINER_REGEX);
  }
}

function printFindings(title, list, limit = 50) {
  if (!list.length) return;
  console.log(`\n[design-lint] ${title}:`);
  list.slice(0, limit).forEach((finding) => {
    console.log(`  ${finding.file} -> ${finding.value}`);
  });
  if (list.length > limit) console.log(`  ... +${list.length - limit} more`);
}

scanDuplicates();
scanComponentRoot();
scanComponentDocs();
collectSourceFiles('src').forEach(scanSourceFile);

printFindings('Duplicate artifact files detected', findings.duplicate);
printFindings('Raw hex colors detected outside token files', findings.hex);
printFindings('Suspicious arbitrary pixel spacing detected', findings.spacing);
printFindings('Undefined design tokens/utilities detected', findings.undefined);
printFindings('Unsupported opacity suffixes detected', findings.opacity);
printFindings('Legacy component taxonomy references detected', findings.taxonomy);
printFindings('Root-level component files detected', findings.componentRoot);
printFindings('Component documentation drift detected', findings.componentDocs);
printFindings('Stale decorative design documentation detected', findings.docsLanguage);
printFindings('Raw palette utilities detected in reusable surfaces', findings.palette);
printFindings('Hard-coded high elevation detected in primitives/composites', findings.elevation);
printFindings('Hard-coded arbitrary radius detected in primitives/composites', findings.radius);
printFindings('Legacy shell escape patterns detected', findings.shell);
printFindings('Direct container shell usage detected', findings.container);

const issueCount = Object.values(findings).reduce((count, list) => count + list.length, 0);

if (issueCount === 0) {
  console.log('[design-lint] No issues found.');
  process.exit(0);
}

process.exit(1);
