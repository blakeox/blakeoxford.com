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
    name: 'Callout',
    category: 'Composites',
    description:
      'Semantic aside for blog and docs. Status tones (info/success/warning/error) live here — keep FeatureCard expressive-only.',
    filePath: 'src/components/composites/Callout.astro',
    props: [
      {
        name: 'variant',
        type: "'info' | 'accent' | 'success' | 'warning' | 'error'",
        required: false,
        default: "'info'",
        description: 'Semantic surface treatment with left accent border',
      },
      { name: 'title', type: 'string', required: false, description: 'Callout heading' },
      {
        name: 'titleLevel',
        type: '2 | 3',
        required: false,
        default: '3',
        description: 'Heading level for the title',
      },
      { name: 'description', type: 'string', required: false, description: 'Supporting copy' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Warning callout',
        code: '<Callout variant="warning" title="Real talk" description="Local models trade depth for independence." />',
      },
    ],
    tags: ['callout', 'aside', 'status', 'blog', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: [
      '--color-info',
      '--color-success',
      '--color-warning',
      '--color-error',
      '--color-accent',
      'rounded-2xl',
    ],
  },
  {
    name: 'ContentBand',
    category: 'Composites',
    description:
      'In-article section or statement band with optional kicker. Prefer CtaBand for full-bleed marketing CTAs with buttons.',
    filePath: 'src/components/composites/ContentBand.astro',
    props: [
      {
        name: 'variant',
        type: "'subtle' | 'surface' | 'accent'",
        required: false,
        default: "'subtle'",
        description: 'Band surface; accent uses on-accent text',
      },
      {
        name: 'align',
        type: "'start' | 'center'",
        required: false,
        default: "'start'",
        description: 'Text alignment',
      },
      { name: 'kicker', type: 'string', required: false, description: 'Optional pill label' },
      { name: 'title', type: 'string', required: false, description: 'Band heading' },
      { name: 'description', type: 'string', required: false, description: 'Supporting copy' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Centered section intro',
        code: '<ContentBand align="center" kicker="Architecture" title="ChatGPT power" description="Zero cloud dependency." />',
      },
    ],
    tags: ['band', 'section', 'blog', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-accent', '--color-surface', 'rounded-2xl'],
  },
  {
    name: 'Timeline',
    category: 'Composites',
    description:
      'Numbered vertical step rail for blog implementation journeys. Slot TimelineItem children.',
    filePath: 'src/components/composites/Timeline.astro',
    props: [
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Implementation steps',
        code: '<Timeline>\n  <TimelineItem step={1} title="Hardening SSH">…</TimelineItem>\n</Timeline>',
      },
    ],
    tags: ['timeline', 'steps', 'blog', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-accent', 'rounded-2xl'],
  },
  {
    name: 'TimelineItem',
    category: 'Composites',
    description: 'One numbered step inside Timeline with accent or primary body treatment.',
    filePath: 'src/components/composites/TimelineItem.astro',
    props: [
      { name: 'step', type: 'number | string', required: true, description: 'Marker label' },
      { name: 'title', type: 'string', required: false, description: 'Step heading' },
      {
        name: 'variant',
        type: "'accent' | 'primary'",
        required: false,
        default: "'accent'",
        description: 'Body surface treatment',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Accent step',
        code: '<TimelineItem step={1} variant="accent" title="Making Ollama a managed service" />',
      },
    ],
    tags: ['timeline', 'steps', 'blog', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-accent', '--color-primary', 'rounded-2xl'],
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
      'Article-density alias of CtaBand for case-study next steps. Same lockup, tighter padding, no full-bleed band.',
    filePath: 'src/components/composites/CTASection.astro',
    examples: [
      {
        title: 'Contact CTA',
        code: '<CTASection heading="Get in touch" description="…" />',
      },
    ],
    tags: ['cta', 'conversion', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-accent', '--font-heading'],
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
        code: '<CtaBand title="…" description="…" primary={{ href: "/contact/", label: "Discuss your bottleneck" }} />',
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
    name: 'ProofPlaque',
    category: 'Composites',
    description:
      'Typographic evidence lockup for featured work and case studies when photography is not available. Number-led; reads in light and dark.',
    filePath: 'src/components/composites/ProofPlaque.astro',
    examples: [
      {
        title: 'Featured proof',
        code: '<ProofPlaque figure="200" caption="teammates enabled" href="/projects/fabric/" />',
      },
    ],
    tags: ['proof', 'media', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface-elevated', '--color-foreground', '--font-heading'],
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
