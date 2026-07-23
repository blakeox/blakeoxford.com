/**
 * Feature component documentation
 */

import type { ComponentDoc } from './types';

export const featureDocs: ComponentDoc[] = [
  {
    name: 'ProjectCard',
    category: 'Features',
    subcategory: 'Projects',
    description:
      'Project listing card for repeated project summaries. Displays hero image, title, description, date, tags, and link while keeping card styling on the shared token contract.',
    filePath: 'src/components/features/projects/ProjectCard.astro',
    props: [
      {
        name: 'project',
        type: "CollectionEntry<'projects'>",
        required: true,
        description: 'Project content collection entry',
      },
    ],
    examples: [
      {
        title: 'Basic usage',
        code: '<ProjectCard project={projectEntry} />',
      },
    ],
    accessibility: [
      'Semantic article element',
      'aria-labelledby linking to project title',
      'Proper heading hierarchy (h3)',
      'Focus-visible styles for keyboard navigation',
      'Alt text required for images',
    ],
    tags: ['project', 'card', 'listing', 'summary'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-lg', 'rounded-2xl'],
  },
  {
    name: 'SearchOverlay',
    category: 'Features',
    subcategory: 'Search',
    description:
      'Command Center site search (React portal). Input-first command palette with grouped results, recent searches, and contextual AI handoff via ? prefix.',
    filePath: 'src/components/features/search/SearchOverlay.astro',
    examples: [
      {
        title: 'Site-wide search',
        code: '<SearchOverlay />',
      },
    ],
    accessibility: [
      'Focus trap while open',
      'Escape clears query then closes overlay and restores focus',
      'aria-modal combobox + listbox pattern',
      'Keyboard: ↑↓ navigate, ↵ open, ⌘↵ new tab, ⌘K / / to open',
    ],
    tags: ['search', 'overlay', 'modal', 'keyboard'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', '--color-glass', 'shadow-lg', '--color-accent'],
    visualBaseline: 'searchOverlay',
  },
  {
    name: 'AboutTimelineSection',
    category: 'Features',
    subcategory: 'About',
    description: 'About-page track record as an editorial year list (shared EditorialList).',
    filePath: 'src/components/features/about/AboutTimelineSection.astro',
    examples: [
      {
        title: 'Track record',
        code: '<AboutTimelineSection kicker="Track record" title="…" description="…" items={page.timeline.items} />',
      },
    ],
    tags: ['timeline', 'about', 'editorial'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-accent', '--color-border'],
  },
  {
    name: 'ContactChannels',
    category: 'Features',
    subcategory: 'Contact',
    description:
      'Contact channel links display. Renders available channels such as email, phone, and LinkedIn with semantic links and tokenized surfaces.',
    filePath: 'src/components/features/contact/ContactChannels.astro',
    props: [
      {
        name: 'channels',
        type: 'ContactChannels',
        required: true,
        description: 'Array of contact channel objects',
      },
    ],
    examples: [
      {
        title: 'Contact channels',
        code: '<ContactChannels channels={contactData} />',
      },
    ],
    accessibility: [
      'section with aria-labelledby',
      'Semantic list structure (ul/li)',
      'Links with descriptive aria-label',
      'Icons hidden with aria-hidden (text provides context)',
      'Decorative elements excluded from accessibility tree',
    ],
    tags: ['contact', 'social', 'links', 'channels'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-accent'],
  },
  {
    name: 'HomeHeroSection',
    category: 'Features',
    subcategory: 'Home',
    description: 'Homepage hero with CoinFlip portrait, promise line, and primary CTAs.',
    filePath: 'src/components/features/home/HomeHeroSection.astro',
    examples: [
      {
        title: 'Home hero',
        code: '<HomeHeroSection author={siteConfig.author} description={tagline} content={page.hero} />',
      },
    ],
    tags: ['home', 'hero', 'landing'],
    visualTier: 'expressive',
    tokenDependencies: ['--gradient-primary', '--color-foreground', '--fs-h1'],
  },
  {
    name: 'HomeCTASection',
    category: 'Features',
    subcategory: 'Home',
    description: 'Homepage conversion band encouraging contact or project exploration.',
    filePath: 'src/components/features/home/HomeCTASection.astro',
    examples: [{ title: 'Home CTA', code: '<HomeCTASection />' }],
    tags: ['home', 'cta', 'conversion'],
    visualTier: 'expressive',
    tokenDependencies: ['--gradient-accent', '--color-on-accent'],
  },
  {
    name: 'HomeRecentProjectsSection',
    category: 'Features',
    subcategory: 'Home',
    description: 'Homepage section listing recent project cards with link to full projects index.',
    filePath: 'src/components/features/home/HomeRecentProjectsSection.astro',
    examples: [
      { title: 'Recent projects', code: '<HomeRecentProjectsSection projects={recentProjects} />' },
    ],
    tags: ['home', 'projects', 'listing'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-foreground', 'gap-6'],
  },
  {
    name: 'HomeLatestPostsSection',
    category: 'Features',
    subcategory: 'Home',
    description: 'Homepage section listing recent blog post cards with link to blog index.',
    filePath: 'src/components/features/home/HomeLatestPostsSection.astro',
    examples: [
      { title: 'Latest posts', code: '<HomeLatestPostsSection posts={recentBlogPosts} />' },
    ],
    tags: ['home', 'blog', 'listing'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-foreground', 'gap-6'],
  },
  {
    name: 'BlogIndexHeroSection',
    category: 'Features',
    subcategory: 'Blog',
    description: 'Blog index page hero with title and introductory copy.',
    filePath: 'src/components/features/blog/BlogIndexHeroSection.astro',
    examples: [{ title: 'Blog hero', code: '<BlogIndexHeroSection />' }],
    tags: ['blog', 'hero', 'index'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-foreground', '--fs-h1'],
  },
  {
    name: 'ProjectHero',
    category: 'Features',
    subcategory: 'Projects',
    description: 'Project detail page hero with title, description, tags, and hero image.',
    filePath: 'src/components/features/projects/ProjectHero.astro',
    examples: [{ title: 'Project hero', code: '<ProjectHero project={entry} />' }],
    tags: ['project', 'hero', 'detail'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-foreground', '--gradient-primary', 'rounded-3xl'],
  },
  {
    name: 'ProjectDetailContent',
    category: 'Features',
    subcategory: 'Projects',
    description:
      'Project detail body rendering MDX content with metrics, journey, and lessons sections.',
    filePath: 'src/components/features/projects/ProjectDetailContent.astro',
    examples: [
      { title: 'Project body', code: '<ProjectDetailContent project={entry} Content={Content} />' },
    ],
    tags: ['project', 'detail', 'mdx'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-foreground', 'prose'],
  },
  {
    name: 'AboutHeroSection',
    category: 'Features',
    subcategory: 'About',
    description: 'About page hero introducing background and professional summary.',
    filePath: 'src/components/features/about/AboutHeroSection.astro',
    examples: [{ title: 'About hero', code: '<AboutHeroSection content={page.hero} />' }],
    tags: ['about', 'hero'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-foreground', '--fs-h1'],
  },
  {
    name: 'ContactHeroSection',
    category: 'Features',
    subcategory: 'Contact',
    description: 'Contact page hero with title and introductory messaging.',
    filePath: 'src/components/features/contact/ContactHeroSection.astro',
    examples: [{ title: 'Contact hero', code: '<ContactHeroSection content={page.hero} />' }],
    tags: ['contact', 'hero'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-foreground', '--fs-h1'],
  },
  {
    name: 'ContactMessageSection',
    category: 'Features',
    subcategory: 'Contact',
    description: 'Contact form section wrapping the ContactFormIsland React component.',
    filePath: 'src/components/features/contact/ContactMessageSection.astro',
    examples: [{ title: 'Contact form', code: '<ContactMessageSection />' }],
    tags: ['contact', 'form'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-field-bg'],
  },
];
