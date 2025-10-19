/**
 * Component Documentation Data
 *
 * Centralized component documentation extracted from JSDoc comments.
 * Used by the component documentation page for searchable component library.
 */

export type ComponentProp = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
};

export type ComponentExample = {
  title: string;
  code: string;
  description?: string;
};

export type ComponentDoc = {
  name: string;
  category: 'Layout' | 'Features' | 'UI' | 'Islands' | 'Primitives' | 'Composites' | 'Common';
  subcategory?: string;
  description: string;
  filePath: string;
  props?: ComponentProp[];
  examples?: ComponentExample[];
  accessibility?: string[];
  performance?: string[];
  tags?: string[];
};

/**
 * Complete component documentation catalog
 */
export const componentDocs: ComponentDoc[] = [
  // Layout Components
  {
    name: 'NavBar',
    category: 'Layout',
    description: 'Main site navigation wrapper. Wraps the NavBarIsland React component with Astro props. Provides site-wide navigation with mobile menu, logo, and theme toggle.',
    filePath: 'src/components/layout/NavBar.astro',
    examples: [
      {
        title: 'Default navigation',
        code: '<NavBar />',
      },
    ],
    accessibility: [
      'Semantic nav element (handled by island)',
      'Keyboard navigation support',
      'Mobile menu with proper ARIA attributes',
      'Focus management for menu toggle',
    ],
    tags: ['navigation', 'layout', 'mobile-menu', 'responsive'],
  },
  {
    name: 'Footer',
    category: 'Layout',
    description: 'Site footer with navigation and social links. Displays quick links, social media links, copyright information, and back-to-top button.',
    filePath: 'src/components/layout/Footer.astro',
    examples: [
      {
        title: 'Site footer',
        code: '<Footer />',
      },
    ],
    accessibility: [
      'role="contentinfo" landmark',
      'aria-label for footer region',
      'role="navigation" for link sections',
      'Proper heading hierarchy with aria-level',
      'Social links with descriptive aria-labels',
      'SVG icons with role="img" and aria-labelledby',
    ],
    tags: ['footer', 'navigation', 'social-links', 'layout'],
  },

  // Feature Components
  {
    name: 'ProjectCard',
    category: 'Features',
    subcategory: 'Projects',
    description: 'Interactive project card for project listings. Displays a project with hero image, title, description, date, tags, and link. Features hover effects with gradient overlay and shadow animations.',
    filePath: 'src/components/features/projects/ProjectCard.astro',
    props: [
      {
        name: 'project',
        type: 'CollectionEntry<\'projects\'>',
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
    tags: ['project', 'card', 'interactive', 'hover-effects', 'gradient'],
  },
  {
    name: 'AIChatWidget',
    category: 'Features',
    subcategory: 'Search',
    description: 'Floating AI search assistant anchored to the bottom-right of the viewport. Provides conversational answers backed by the AutoRAG API and surfaces cited sources.',
    filePath: 'src/components/AIChatWidget.astro',
    examples: [
      {
        title: 'Site-wide assistant',
        code: '<AIChatWidget />',
      },
    ],
    accessibility: [
      'Launcher button with aria-expanded sync and keyboard shortcut support',
      'Dialog with aria-modal="true" and labelled title',
      'Escape key closes the assistant and focus returns to the triggering control',
      'Sources rendered as accessible link list',
    ],
    performance: [
      'Client island lazy-loaded with minimal bundle',
      'Upstream requests proxied through the Worker to enable caching and rate control elsewhere',
      'History trimmed to recent prompts to keep payload small',
    ],
    tags: ['ai', 'assistant', 'search', 'chat'],
  },
  {
    name: 'AboutTimeline',
    category: 'Features',
    subcategory: 'About',
    description: 'Interactive timeline display. Displays a horizontal scrollable timeline with events, achievements, and milestones. Features gradient overlays, decorative elements, and responsive design.',
    filePath: 'src/components/features/about/AboutTimeline.astro',
    props: [
      {
        name: 'timeline',
        type: 'TimelineSection',
        required: true,
        description: 'Timeline data with year, title, icon, achievements',
      },
    ],
    examples: [
      {
        title: 'Timeline display',
        code: '<AboutTimeline timeline={timelineData} />',
      },
    ],
    accessibility: [
      'role="listitem" for timeline entries',
      'aria-label descriptive labels ("{year} – {title}")',
      'Nested lists with proper roles',
      'aria-hidden for decorative backgrounds',
      'role="region" for scrollable container',
      'tabindex="0" for keyboard scrolling',
      'focus-visible styles for keyboard navigation',
    ],
    tags: ['timeline', 'scrollable', 'interactive', 'achievements'],
  },
  {
    name: 'ContactChannels',
    category: 'Features',
    subcategory: 'Contact',
    description: 'Contact channel links display. Displays available contact channels (email, phone, LinkedIn) with icons and interactive cards. Features hover effects and glass morphism design.',
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
    tags: ['contact', 'social', 'glass-morphism', 'cards'],
  },
  {
    name: 'BlogPostCard',
    category: 'Features',
    subcategory: 'Blog',
    description: 'Reusable blog post card for listings. Displays a blog post with date, title, description, tags, and read more link. Optimized for grid layouts with hover effects.',
    filePath: 'src/components/features/blog/BlogPostCard.astro',
    props: [
      {
        name: 'post',
        type: 'CollectionEntry<\'blog\'>',
        required: true,
        description: 'Blog post content collection entry',
      },
      {
        name: 'maxTags',
        type: 'number',
        required: false,
        default: '3',
        description: 'Maximum number of tags to display',
      },
    ],
    examples: [
      {
        title: 'Basic usage',
        code: '<BlogPostCard post={blogEntry} />',
      },
      {
        title: 'Custom max tags',
        code: '<BlogPostCard post={blogEntry} maxTags={5} />',
      },
    ],
    accessibility: [
      'Semantic article element',
      'Focus-visible styles',
      'Descriptive link text',
    ],
    tags: ['blog', 'card', 'post', 'tags'],
  },
  {
    name: 'EducationCard',
    category: 'Features',
    subcategory: 'About',
    description: 'Education display card with icon and details. Displays educational background with institution, degree, and description.',
    filePath: 'src/components/features/about/EducationCard.astro',
    props: [
      {
        name: 'institution',
        type: 'string',
        required: true,
        description: 'Institution name',
      },
      {
        name: 'degree',
        type: 'string',
        required: true,
        description: 'Degree or certification',
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Additional description',
      },
    ],
    examples: [
      {
        title: 'Basic usage',
        code: '<EducationCard institution="University" degree="BS Computer Science" />',
      },
    ],
    accessibility: [
      'Semantic structure',
      'Icon with proper ARIA',
      'Hover effects',
    ],
    tags: ['education', 'card', 'about'],
  },

  // UI Components
  {
    name: 'PhotoCarousel',
    category: 'UI',
    description: 'Responsive photo carousel with navigation. Displays a collection of photos in a carousel with prev/next navigation, autoplay, and responsive image loading. Includes accessibility features for screen readers and keyboard navigation.',
    filePath: 'src/components/ui/PhotoCarousel.astro',
    examples: [
      {
        title: 'Default carousel',
        code: '<PhotoCarousel />',
      },
    ],
    accessibility: [
      'role="region" with aria-label="Photo carousel"',
      'Semantic list structure (ul/li)',
      'Alt text for all images',
      'Keyboard navigation support (prev/next buttons)',
      'ARIA labels on navigation buttons',
    ],
    performance: [
      'Lazy loading images',
      'Responsive image sizing',
      'Optimized navigation',
    ],
    tags: ['carousel', 'photos', 'slider', 'navigation'],
  },
  {
    name: 'CoinFlipImage',
    category: 'UI',
    description: 'Interactive 3D coin flip image component. Displays two images with a 3D flip animation effect. Supports click-to-flip, auto-flip, and customizable animation parameters. Optimized for performance with lazy loading.',
    filePath: 'src/components/ui/CoinFlipImage.astro',
    props: [
      { name: 'frontSrc', type: 'string', required: true, description: 'Front image source URL' },
      { name: 'backSrc', type: 'string', required: true, description: 'Back image source URL' },
      { name: 'alt', type: 'string', required: true, description: 'Front image alt text' },
      { name: 'altBack', type: 'string', required: true, description: 'Back image alt text' },
      { name: 'size', type: 'number', required: false, default: '144', description: 'Image size in pixels' },
      { name: 'flipMultipleTimes', type: 'boolean', required: false, default: 'false', description: 'Enable auto-flip animation' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
      { name: 'duration', type: 'number', required: false, default: '700', description: 'Flip animation duration in ms' },
      { name: 'flipOnClick', type: 'boolean', required: false, default: 'true', description: 'Enable click-to-flip' },
      { name: 'flipAxis', type: '\'x\'|\'y\'', required: false, default: '\'y\'', description: 'Flip axis (horizontal or vertical)' },
    ],
    examples: [
      {
        title: 'Basic coin flip',
        code: '<CoinFlipImage frontSrc="/front.jpg" backSrc="/back.jpg" alt="Front image" altBack="Back image" />',
      },
      {
        title: 'Auto-flip with custom duration',
        code: '<CoinFlipImage frontSrc="/front.jpg" backSrc="/back.jpg" alt="Front" altBack="Back" flipMultipleTimes={true} duration={1000} />',
      },
    ],
    accessibility: [
      'Button with descriptive aria-label',
      'Alt text for both images',
      'Keyboard accessible (Enter/Space)',
      'Focus-visible styles',
    ],
    performance: [
      'Lazy loading by default',
      'GPU-accelerated animations',
      'Optimized transform properties',
    ],
    tags: ['interactive', 'animation', '3d', 'flip', 'images'],
  },
  {
    name: 'OptimizedImage',
    category: 'UI',
    description: 'Performance-optimized image component. Wrapper around Astro\'s Image component with automatic format conversion, lazy loading, and quality optimization. Supports both local and remote images.',
    filePath: 'src/components/ui/OptimizedImage.astro',
    props: [
      { name: 'src', type: 'string | ImageMetadata', required: true, description: 'Image source (local import or URL)' },
      { name: 'alt', type: 'string', required: true, description: 'Alt text for accessibility' },
      { name: 'width', type: 'number', required: false, description: 'Image width in pixels' },
      { name: 'height', type: 'number', required: false, description: 'Image height in pixels' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
      { name: 'loading', type: '\'lazy\' | \'eager\'', required: false, default: '\'lazy\'', description: 'Loading strategy' },
      { name: 'priority', type: 'boolean', required: false, default: 'false', description: 'Priority loading (sets eager + fetchpriority)' },
      { name: 'quality', type: 'number', required: false, default: '80', description: 'Image quality (1-100)' },
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
  },

  // Island Components
  {
    name: 'NavBarIsland',
    category: 'Islands',
    description: 'React island for site navigation. Interactive navigation bar with mobile menu, logo, and responsive design. Integrates ModernNavBar and MotionAccessibility for enhanced UX.',
    filePath: 'src/components/islands/NavBarIsland.tsx',
    props: [
      { name: 'links', type: 'NavLink[]', required: true, description: 'Navigation links configuration' },
      { name: 'logo', type: 'LogoConfig', required: true, description: 'Logo configuration with name and avatar' },
      { name: 'currentPath', type: 'string', required: false, description: 'Current page path for active link highlighting' },
    ],
    examples: [
      {
        title: 'Navigation island',
        code: '<NavBarIsland client:load links={navLinks} currentPath={Astro.url.pathname} logo={logoConfig} />',
      },
    ],
    accessibility: [
      'Semantic nav element',
      'Mobile menu with ARIA attributes',
      'Keyboard navigation (Tab, Enter, Escape)',
      'Focus management for menu toggle',
      'Screen reader announcements',
    ],
    tags: ['react', 'island', 'navigation', 'interactive'],
  },

  // Primitive Components
  {
    name: 'Badge',
    category: 'Primitives',
    description: 'Simple badge component for tags and labels',
    filePath: 'src/components/primitives/Badge.astro',
    props: [
      { name: 'variant', type: 'string', required: false, description: 'Badge style variant' },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Basic badge',
        code: '<Badge>TypeScript</Badge>',
      },
    ],
    tags: ['badge', 'tag', 'label', 'primitive'],
  },
  {
    name: 'Button',
    category: 'Primitives',
    description: 'Flexible button component with variants and states',
    filePath: 'src/components/primitives/Button.astro',
    props: [
      { name: 'type', type: '\'button\'|\'submit\'|\'reset\'', required: false, default: '\'button\'', description: 'Button type' },
      { name: 'variant', type: 'string', required: false, description: 'Button variant (primary, secondary, etc.)' },
      { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disabled state' },
      { name: 'href', type: 'string', required: false, description: 'If provided, renders as link' },
      { name: 'ariaLabel', type: 'string', required: false, description: 'Accessible label' },
    ],
    examples: [
      {
        title: 'Primary button',
        code: '<Button variant="primary">Click me</Button>',
      },
    ],
    accessibility: [
      'Proper button type',
      'Optional aria-label',
      'Focus-visible styles',
      'Can render as link with href',
    ],
    tags: ['button', 'interactive', 'primitive'],
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
      { name: 'as', type: 'string', required: false, default: '\'div\'', description: 'HTML element to render' },
      { name: 'role', type: 'string', required: false, description: 'ARIA role' },
    ],
    examples: [
      {
        title: 'Horizontal layout',
        code: '<Flex direction="row" gap="4"><Button>1</Button><Button>2</Button></Flex>',
      },
    ],
    tags: ['flex', 'layout', 'primitive'],
  },
  {
    name: 'Grid',
    category: 'Primitives',
    description: 'CSS Grid layout primitive',
    filePath: 'src/components/primitives/Grid.astro',
    props: [
      { name: 'cols', type: 'string', required: false, description: 'Grid columns' },
      { name: 'gap', type: 'string', required: false, description: 'Gap between items' },
      { name: 'as', type: 'string', required: false, default: '\'div\'', description: 'HTML element to render' },
      { name: 'role', type: 'string', required: false, description: 'ARIA role' },
    ],
    examples: [
      {
        title: 'Responsive grid',
        code: '<Grid cols="3"><Card>1</Card><Card>2</Card><Card>3</Card></Grid>',
      },
    ],
    tags: ['grid', 'layout', 'primitive'],
  },
  {
    name: 'Section',
    category: 'Primitives',
    description: 'Semantic section wrapper with optional styling',
    filePath: 'src/components/primitives/Section.astro',
    props: [
      { name: 'as', type: 'string', required: false, default: '\'section\'', description: 'HTML element to render' },
      { name: 'ariaLabelledby', type: 'string', required: false, description: 'ARIA labelledby ID' },
    ],
    examples: [
      {
        title: 'Content section',
        code: '<Section><h2>Heading</h2><p>Content</p></Section>',
      },
    ],
    tags: ['section', 'semantic', 'primitive'],
  },
  {
    name: 'FormField',
    category: 'Primitives',
    description: 'Accessible form field with label, input, and error handling',
    filePath: 'src/components/primitives/FormField.astro',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Field label' },
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'type', type: 'string', required: false, default: '\'text\'', description: 'Input type' },
      { name: 'required', type: 'boolean', required: false, default: 'false', description: 'Required field' },
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
  },
];

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentDoc['category']): ComponentDoc[] {
  return componentDocs.filter((doc) => doc.category === category);
}

/**
 * Search components by name or tags
 */
export function searchComponents(query: string): ComponentDoc[] {
  const lowerQuery = query.toLowerCase();
  return componentDocs.filter((doc) => {
    const nameMatch = doc.name.toLowerCase().includes(lowerQuery);
    const descMatch = doc.description.toLowerCase().includes(lowerQuery);
    const tagMatch = doc.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
    return nameMatch || descMatch || tagMatch;
  });
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(componentDocs.map((doc) => doc.category)));
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = componentDocs.flatMap((doc) => doc.tags || []);
  return Array.from(new Set(tags)).sort();
}
