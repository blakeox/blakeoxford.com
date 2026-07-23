/**
 * Primitive component documentation
 */

import type { ComponentDoc } from './types';

export const primitiveDocs: ComponentDoc[] = [
  {
    name: 'OptimizedImage',
    category: 'Primitives',
    description:
      "Performance-optimized image component. Wrapper around Astro's Image component with automatic format conversion, lazy loading, and quality optimization. Supports both local and remote images.",
    filePath: 'src/components/primitives/OptimizedImage.astro',
    props: [
      {
        name: 'src',
        type: 'string | ImageMetadata',
        required: true,
        description: 'Image source (local import or URL)',
      },
      { name: 'alt', type: 'string', required: true, description: 'Alt text for accessibility' },
      { name: 'width', type: 'number', required: false, description: 'Image width in pixels' },
      { name: 'height', type: 'number', required: false, description: 'Image height in pixels' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
      {
        name: 'loading',
        type: "'lazy' | 'eager'",
        required: false,
        default: "'lazy'",
        description: 'Loading strategy',
      },
      {
        name: 'priority',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Priority loading (sets eager + fetchpriority)',
      },
      {
        name: 'quality',
        type: 'number',
        required: false,
        default: '80',
        description: 'Image quality (1-100)',
      },
    ],
    examples: [
      {
        title: 'Local image',
        code: '<OptimizedImage src={import(\'@/assets/hero.jpg\')} alt="Hero image" width={800} height={600} />',
      },
      {
        title: 'Remote image with priority loading',
        code: '<OptimizedImage src="https://example.com/image.jpg" alt="Remote image" priority={true} quality={90} />',
      },
    ],
    performance: [
      'Automatic WebP/AVIF conversion',
      'Lazy loading by default',
      'Responsive image sizing',
      'Quality optimization (default 80)',
    ],
    tags: ['image', 'optimization', 'performance', 'responsive'],
    visualTier: 'quiet',
    tokenDependencies: ['rounded-lg'],
  },
  {
    name: 'Badge',
    category: 'Primitives',
    description:
      'Simple badge component for tags, labels, and semantic status indicators. Prefer variant="pill" for uppercase meta tags (BadgePill is a thin preset).',
    filePath: 'src/components/primitives/Badge.astro',
    props: [
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'outline' | 'subtle' | 'pill' | 'success' | 'warning' | 'error'",
        required: false,
        default: "'secondary'",
        description: 'Semantic badge variant — pill is uppercase meta styling',
      },
      {
        name: 'size',
        type: "'xs' | 'sm' | 'md'",
        required: false,
        default: "'sm'",
        description: 'Badge size preset',
      },
      {
        name: 'showDot',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Decorative accent dot (works best with pill)',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Basic badge',
        code: '<Badge>TypeScript</Badge>',
      },
      {
        title: 'Pill meta tag',
        code: '<Badge variant="pill" showDot>Case Study</Badge>',
      },
    ],
    tags: ['badge', 'tag', 'label', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--color-surface', '--color-border', 'rounded-full'],
  },
  {
    name: 'Button',
    category: 'Primitives',
    description:
      'Flexible button/link primitive with tokenized variants, stable sizes, and accessible focus states.',
    filePath: 'src/components/primitives/Button.astro',
    props: [
      {
        name: 'type',
        type: "'button'|'submit'|'reset'",
        required: false,
        default: "'button'",
        description: 'Button type',
      },
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'link'",
        required: false,
        default: "'primary'",
        description: 'Button variant',
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        required: false,
        default: "'md'",
        description: 'Button size preset',
      },
      {
        name: 'disabled',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Disabled state',
      },
      {
        name: 'href',
        type: 'string',
        required: false,
        description: 'If provided, renders as link',
      },
      {
        name: 'fullWidth',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Stretch button to parent width',
      },
      {
        name: "'aria-label'",
        type: 'string',
        required: false,
        description: 'Accessible label for icon-only or ambiguous controls',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
      {
        name: 'data-testid',
        type: 'string',
        required: false,
        description: 'Stable test hook for Playwright and unit tests',
      },
    ],
    examples: [
      {
        title: 'Primary button',
        code: '<Button variant="primary" data-testid="submit-cta">Click me</Button>',
      },
    ],
    accessibility: [
      'Proper button type',
      'Optional aria-label',
      'Focus-visible styles',
      'Can render as link with href',
    ],
    tags: ['button', 'interactive', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--color-surface', '--color-border', 'rounded-full'],
  },
  {
    name: 'Container',
    category: 'Primitives',
    description: 'Responsive container with max-width constraints',
    filePath: 'src/components/primitives/Container.astro',
    props: [
      { name: 'size', type: 'string', required: false, description: 'Container size preset' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Default container',
        code: '<Container><p>Content</p></Container>',
      },
    ],
    tags: ['container', 'layout', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--container-padding', '--container-padding-lg'],
  },
  {
    name: 'Prose',
    category: 'Primitives',
    description:
      'Article/MDX typography shell. Encodes the blog prose recipe once so pages do not scatter long prose-* modifier strings. Token remaps live in @utility prose.',
    filePath: 'src/components/primitives/Prose.astro',
    props: [
      {
        name: 'size',
        type: "'base' | 'lg' | 'xl'",
        required: false,
        default: "'xl'",
        description: 'Typography scale (maps to prose / prose-lg / prose-lg lg:prose-xl)',
      },
      {
        name: 'as',
        type: "'div' | 'article' | 'section'",
        required: false,
        default: "'div'",
        description: 'HTML element to render',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Blog article body',
        code: '<Prose>\n  <Content />\n</Prose>',
      },
      {
        title: 'Compact prose',
        code: '<Prose size="base"><p>Short copy</p></Prose>',
      },
    ],
    tags: ['prose', 'typography', 'mdx', 'blog', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['prose', '--color-foreground', '--color-accent-emphasis', '--font-heading'],
  },
  {
    name: 'Flex',
    category: 'Primitives',
    description: 'Flexbox layout primitive',
    filePath: 'src/components/primitives/Flex.astro',
    props: [
      { name: 'direction', type: 'string', required: false, description: 'Flex direction' },
      { name: 'gap', type: 'string', required: false, description: 'Gap between items' },
      { name: 'align', type: 'string', required: false, description: 'Align items' },
      { name: 'justify', type: 'string', required: false, description: 'Justify content' },
      { name: 'wrap', type: 'boolean', required: false, description: 'Flex wrap' },
      {
        name: 'as',
        type: 'string',
        required: false,
        default: "'div'",
        description: 'HTML element to render',
      },
      { name: 'role', type: 'string', required: false, description: 'ARIA role' },
    ],
    examples: [
      {
        title: 'Horizontal layout',
        code: '<Flex direction="row" gap="4"><Button>1</Button><Button>2</Button></Flex>',
      },
    ],
    tags: ['flex', 'layout', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: [],
  },
  {
    name: 'Grid',
    category: 'Primitives',
    description: 'CSS Grid layout primitive',
    filePath: 'src/components/primitives/Grid.astro',
    props: [
      { name: 'cols', type: 'string', required: false, description: 'Grid columns' },
      { name: 'gap', type: 'string', required: false, description: 'Gap between items' },
      {
        name: 'as',
        type: 'string',
        required: false,
        default: "'div'",
        description: 'HTML element to render',
      },
      { name: 'role', type: 'string', required: false, description: 'ARIA role' },
    ],
    examples: [
      {
        title: 'Responsive grid',
        code: '<Grid cols="3"><BaseCard>1</BaseCard><BaseCard>2</BaseCard><BaseCard>3</BaseCard></Grid>',
      },
    ],
    tags: ['grid', 'layout', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: [],
  },
  {
    name: 'Section',
    category: 'Primitives',
    description: 'Semantic section wrapper with optional styling',
    filePath: 'src/components/primitives/Section.astro',
    props: [
      {
        name: 'as',
        type: 'string',
        required: false,
        default: "'section'",
        description: 'HTML element to render',
      },
      {
        name: 'ariaLabelledby',
        type: 'string',
        required: false,
        description: 'ARIA labelledby ID',
      },
    ],
    examples: [
      {
        title: 'Content section',
        code: '<Section><h2>Heading</h2><p>Content</p></Section>',
      },
    ],
    tags: ['section', 'semantic', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-background', '--color-surface'],
  },
  {
    name: 'FormField',
    category: 'Primitives',
    description: 'Accessible form field with label, input, and error handling',
    filePath: 'src/components/primitives/FormField.astro',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Field label' },
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      {
        name: 'type',
        type: 'string',
        required: false,
        default: "'text'",
        description: 'Input type',
      },
      {
        name: 'required',
        type: 'boolean',
        required: false,
        default: 'false',
        description: 'Required field',
      },
      { name: 'error', type: 'string', required: false, description: 'Error message' },
      { name: 'helperText', type: 'string', required: false, description: 'Helper text' },
    ],
    examples: [
      {
        title: 'Email field',
        code: '<FormField label="Email" name="email" type="email" required />',
      },
    ],
    accessibility: [
      'aria-required for required fields',
      'aria-describedby linking to helper/error text',
      'role="alert" with aria-live for errors',
      'Proper label association',
    ],
    tags: ['form', 'input', 'accessibility', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-border', '--color-foreground', '--color-error'],
  },
  {
    name: 'BaseCard',
    category: 'Primitives',
    description:
      'Canonical card primitive. Owns border, surface, elevation, hover, and slot structure (header, image, footer). Prefer this over ad-hoc card classes.',
    filePath: 'src/components/primitives/BaseCard.astro',
    props: [
      {
        name: 'variant',
        type: "'default' | 'glass' | 'elevated' | 'subtle'",
        required: false,
        default: "'default'",
        description: 'Surface preset — elevated uses shadow-lg for interactive cards',
      },
      {
        name: 'hover',
        type: "'none' | 'lift' | 'scale'",
        required: false,
        default: "'lift'",
        description: 'Motion-safe hover treatment',
      },
      {
        name: 'rounded',
        type: "'lg' | 'xl' | '2xl' | '3xl'",
        required: false,
        default: "'2xl'",
        description: 'Border radius preset',
      },
      {
        name: 'padding',
        type: "'none' | 'sm' | 'md' | 'lg'",
        required: false,
        default: "'md'",
        description: 'Inner padding preset',
      },
      {
        name: 'as',
        type: "'article' | 'div' | 'section'",
        required: false,
        default: "'div'",
        description: 'Semantic HTML element',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Elevated card with slots',
        code: '<BaseCard variant="elevated" hover="lift">\n  <div slot="header">Title</div>\n  <p>Body</p>\n</BaseCard>',
      },
    ],
    accessibility: [
      'focus-within ring for keyboard users inside interactive cards',
      'Semantic as prop for article/section landmarks',
    ],
    tags: ['card', 'surface', 'primitive'],
    visualTier: 'elevated',
    tokenDependencies: [
      '--color-surface',
      '--color-border',
      '--color-glass',
      'shadow-sm',
      'shadow-lg',
      'rounded-2xl',
    ],
  },
  {
    name: 'Stack',
    category: 'Primitives',
    description:
      'Vertical spacing primitive using space-y-* utilities. Standardizes rhythm between stacked children.',
    filePath: 'src/components/primitives/Stack.astro',
    props: [
      {
        name: 'space',
        type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'",
        required: false,
        default: "'md'",
        description: 'Vertical gap preset',
      },
      {
        name: 'as',
        type: "'div' | 'section' | 'article' | 'ul' | 'ol' | 'nav' | 'header' | 'footer'",
        required: false,
        default: "'div'",
        description: 'Semantic HTML element',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Section content stack',
        code: '<Stack space="md">\n  <h2>Title</h2>\n  <p>Body copy</p>\n</Stack>',
      },
    ],
    tags: ['layout', 'spacing', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: [],
  },
  {
    name: 'SectionHeading',
    category: 'Primitives',
    description:
      'Standardized section heading. Shares the type ladder with IntroCopy via src/lib/typeScale.ts (identity → hero → display → section → title → subtitle; xl–5xl aliases still work).',
    filePath: 'src/components/primitives/SectionHeading.astro',
    examples: [
      {
        title: 'Section intro',
        code: '<SectionHeading size="section">Recent Projects</SectionHeading>',
      },
    ],
    tags: ['heading', 'typography', 'section', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-foreground', '--font-heading'],
  },
  {
    name: 'SkipLink',
    category: 'Primitives',
    description:
      'Accessibility skip link for keyboard users to bypass navigation and jump to main content.',
    filePath: 'src/components/primitives/SkipLink.astro',
    examples: [
      {
        title: 'Skip to main',
        code: '<SkipLink href="#main-content">Skip to main content</SkipLink>',
      },
    ],
    accessibility: ['Visible on focus', 'First focusable element in document order'],
    tags: ['accessibility', 'navigation', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-accent', '--color-surface', '--focus-ring-color'],
  },
];
