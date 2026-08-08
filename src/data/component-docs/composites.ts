/**
 * Composite component documentation
 */

import type { ComponentDoc } from './types';

export const compositeDocs: ComponentDoc[] = [
  {
    name: 'AIChatWidget',
    category: 'Composites',
    subcategory: 'Search',
    description:
      'Corner Ask companion — docked chat panel for questions about the current page or the site. Opens from the FAB; stays over the page while browsing. Site search lives separately in the nav (⌘K).',
    filePath: 'src/components/composites/AIChatWidget.astro',
    examples: [
      {
        title: 'Site-wide assistant',
        code: '<AIChatWidget />',
      },
    ],
    accessibility: [
      'Launcher button with aria-expanded sync',
      'Non-modal dialog (aria-modal="false") so the page stays readable and interactive on desktop',
      'Escape key closes the assistant',
      'Sources rendered as accessible link list',
    ],
    performance: [
      'Client island lazy-loaded with minimal bundle',
      'Upstream requests proxied through the Worker to enable caching and rate control elsewhere',
      'History trimmed to recent prompts to keep payload small',
    ],
    tags: ['ai', 'assistant', 'search', 'chat'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', '--color-accent', 'shadow-lg'],
  },
  {
    name: 'PhotoCarousel',
    category: 'Composites',
    description:
      'Decorative scrolling photo collage for the About hero. Horizontal marquee on mobile; three vertical columns on desktop. Includes a pause control; also pauses on hover and when reduced motion is preferred.',
    filePath: 'src/components/composites/PhotoCarousel.astro',
    props: [
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Default collage',
        code: '<PhotoCarousel class="h-full w-full" />',
      },
    ],
    accessibility: [
      'role="region" with descriptive aria-label',
      'Decorative tracks marked aria-hidden',
      'Empty alt on collage images (region label carries meaning)',
      'Focusable pause/play control for keyboard users',
      'Motion gated by prefers-reduced-motion; pauses on hover',
    ],
    performance: [
      'Lazy loading',
      'astro:assets Image',
      'GPU translate3d marquees',
      'Capped image budget',
    ],
    tags: ['carousel', 'photos', 'marquee', 'decorative'],
    visualTier: 'elevated',
    tokenDependencies: ['shadow-lg', 'rounded-2xl', 'duration-normal'],
  },
  {
    name: 'CoinFlipImage',
    category: 'Composites',
    description:
      'Interactive 3D coin flip portrait. Flip state is CSS `data-flipped`; optional multi-spin flourish on hover. Click toggles faces with a polite live announcement. Back face loads lazily.',
    filePath: 'src/components/composites/CoinFlipImage.astro',
    props: [
      { name: 'frontSrc', type: 'string', required: true, description: 'Front image source URL' },
      { name: 'backSrc', type: 'string', required: true, description: 'Back image source URL' },
      { name: 'alt', type: 'string', required: true, description: 'Front image alt text' },
      { name: 'altBack', type: 'string', required: true, description: 'Back image alt text' },
      {
        name: 'size',
        type: 'number',
        required: false,
        default: '144',
        description: 'Image size in pixels',
      },
      {
        name: 'flipMultipleTimes',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Enable multi-spin flourish on hover when not flipped',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
      {
        name: 'duration',
        type: 'number',
        required: false,
        default: '700',
        description: 'Flip animation duration in ms',
      },
      {
        name: 'flipOnClick',
        type: 'boolean',
        required: false,
        default: 'true',
        description: 'Enable click-to-flip',
      },
      {
        name: 'flipAxis',
        type: "'x'|'y'",
        required: false,
        default: "'y'",
        description: 'Flip axis (horizontal or vertical)',
      },
    ],
    examples: [
      {
        title: 'Basic coin flip',
        code: '<CoinFlipImage frontSrc="/front.jpg" backSrc="/back.jpg" alt="Front image" altBack="Back image" />',
      },
      {
        title: 'Hero portrait with hover spin',
        code: '<CoinFlipImage frontSrc="/front.jpg" backSrc="/back.jpg" alt="Front" altBack="Back" size={300} flipMultipleTimes loading="eager" fetchPriority="high" />',
      },
    ],
    accessibility: [
      'Button with descriptive aria-label from alt texts',
      'aria-pressed + polite live region on toggle',
      'Native keyboard activation (Enter/Space)',
      'focus-ring-interactive + reduced-motion disables transition',
      'Visible Flip hint until first interaction',
    ],
    performance: [
      'Front loading configurable; back face always lazy until warmed',
      'Optimized AVIF/WebP srcsets from image manifests',
      'CSS transform only (no React island)',
    ],
    tags: ['interactive', 'animation', '3d', 'flip', 'images'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', 'rounded-full', '--ease-emphasized', 'shadow-lg'],
  },
  {
    name: 'FeatureCard',
    category: 'Composites',
    description:
      'Semantic feature surface with token-backed color variants. Use for marketing/feature grids instead of page-specific card styles. Prefer text titles — no emoji icon prop.',
    filePath: 'src/components/composites/FeatureCard.astro',
    props: [
      {
        name: 'variant',
        type: "'accent' | 'primary'",
        required: false,
        default: "'accent'",
        description: 'Expressive treatment; use Badge or a stateful component for status semantics',
      },
      { name: 'title', type: 'string', required: false, description: 'Card heading' },
      { name: 'description', type: 'string', required: false, description: 'Supporting copy' },
      {
        name: 'hover',
        type: 'boolean',
        required: false,
        default: 'true',
        description: 'Enable hover lift',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Accent feature',
        code: '<FeatureCard variant="accent" title="Fast" description="Island architecture." />',
      },
    ],
    tags: ['card', 'feature', 'semantic', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: [
      '--color-accent',
      '--color-primary',
      '--color-surface',
      'rounded-2xl',
      'shadow-sm',
    ],
  },
  {
    name: 'PageHero',
    category: 'Composites',
    description: 'Page-level hero with kicker, title, description, and optional actions slot.',
    filePath: 'src/components/composites/PageHero.astro',
    examples: [
      {
        title: 'Index hero',
        code: '<PageHero kicker="Blog" title="Articles" description="Thoughts on systems and AI." />',
      },
    ],
    tags: ['hero', 'page', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-foreground', '--color-muted-foreground', '--fs-h1'],
  },
  {
    name: 'CTASection',
    category: 'Composites',
    description:
      'Conversion-focused call-to-action band with heading, description, and button group.',
    filePath: 'src/components/composites/CTASection.astro',
    examples: [
      {
        title: 'Contact CTA',
        code: '<CTASection heading="Get in touch" href="/contact/">Contact</CTASection>',
      },
    ],
    tags: ['cta', 'conversion', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--gradient-accent', '--color-on-accent', 'rounded-3xl'],
  },
  {
    name: 'SectionHeader',
    category: 'Composites',
    description: 'Shared section intro with kicker, title, optional description and action.',
    filePath: 'src/components/composites/SectionHeader.astro',
    examples: [
      {
        title: 'Section intro',
        code: '<SectionHeader kicker="Work" title="Selected work" description="…" />',
      },
    ],
    tags: ['header', 'section', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--font-heading'],
  },
  {
    name: 'CtaBand',
    category: 'Composites',
    description: 'Full-bleed closing CTA band shared by home, work, and about.',
    filePath: 'src/components/composites/CtaBand.astro',
    examples: [
      {
        title: 'Closing CTA',
        code: '<CtaBand title="…" description="…" primary={{ href: "/contact/", label: "Book a review" }} />',
      },
    ],
    tags: ['cta', 'band', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['home-cta-band', '--color-accent'],
  },
  {
    name: 'IntroCopy',
    category: 'Composites',
    description:
      'Tight kicker + heading + optional emphasis/description stack for heroes and featured lockups.',
    filePath: 'src/components/composites/IntroCopy.astro',
    examples: [
      {
        title: 'Centered hero copy',
        code: '<IntroCopy kicker="Selected work" title="…" description="…" align="center" />',
      },
    ],
    tags: ['hero', 'typography', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--font-heading', 'section-kicker'],
    props: [
      {
        name: 'size',
        type: "'hero' | 'display' | 'section' | 'identity'",
        required: false,
        default: 'hero',
        description: 'Heading ladder; identity is the home-name lockup.',
      },
      {
        name: 'descriptionTone',
        type: "'muted' | 'strong'",
        required: false,
        default: 'muted',
        description: 'Body color — strong for the home promise line.',
      },
    ],
  },
  {
    name: 'DotMetaList',
    category: 'Composites',
    description: 'Quiet inline chip list with accent dots for capabilities and focus areas.',
    filePath: 'src/components/composites/DotMetaList.astro',
    examples: [
      {
        title: 'Capability chips',
        code: '<DotMetaList items={["Migrations", "Automation"]} label="Focus" align="center" />',
      },
    ],
    tags: ['list', 'meta', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--color-muted-foreground'],
  },
  {
    name: 'EditorialList',
    category: 'Composites',
    description:
      'Divided proof rows. Use aside kickers for short labels (years); inline kickers for long metrics (`kickerAside={false}`).',
    filePath: 'src/components/composites/EditorialList.astro',
    examples: [
      {
        title: 'Proof rows',
        code: '<EditorialList rows={[{ title: "Migrations", body: "…", bullets: [] }]} />',
      },
      {
        title: 'Metric-led outcomes',
        code: '<EditorialList numbered={false} kickerAside={false} rows={[{ kicker: "180 users migrated", title: "…", bullets: [] }]} />',
      },
    ],
    tags: ['list', 'editorial', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-border', '--color-accent'],
  },
  {
    name: 'MetricsTable',
    category: 'Composites',
    description:
      'Structured metrics table for project KPIs with label, result, and timeline columns.',
    filePath: 'src/components/composites/MetricsTable.astro',
    examples: [
      { title: 'Project metrics', code: '<MetricsTable metrics={project.data.metrics} />' },
    ],
    tags: ['table', 'metrics', 'project', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-muted-foreground'],
  },
  {
    name: 'ButtonGroup',
    category: 'Composites',
    description: 'Horizontal or vertical grouping of Button primitives with consistent spacing.',
    filePath: 'src/components/composites/ButtonGroup.astro',
    examples: [
      {
        title: 'Action group',
        code: '<ButtonGroup><Button>Primary</Button><Button variant="outline">Secondary</Button></ButtonGroup>',
      },
    ],
    tags: ['button', 'layout', 'composite'],
    visualTier: 'quiet',
    tokenDependencies: ['gap-3'],
  },
];
