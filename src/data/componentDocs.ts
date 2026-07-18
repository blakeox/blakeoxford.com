/**
 * Component Documentation Data
 *
 * Centralized component documentation extracted from JSDoc comments.
 * Used by the component documentation page for searchable component library.
 */

import type { ComponentVisualBaselineKey } from './componentVisualBaselines';
import { PRIMITIVE_PROP_CONTRACT } from './primitivePropContract';

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

export type VisualTier = 'quiet' | 'elevated' | 'expressive';

export type ComponentDoc = {
  name: string;
  category: 'Layout' | 'Features' | 'Islands' | 'Primitives' | 'Composites';
  subcategory?: string;
  description: string;
  filePath: string;
  props?: ComponentProp[];
  examples?: ComponentExample[];
  accessibility?: string[];
  performance?: string[];
  tags?: string[];
  /** Visual weight tier from /design/patterns — quiet (static), elevated (interactive cards), expressive (hero/modal) */
  visualTier?: VisualTier;
  /** CSS custom properties and semantic utilities this component depends on */
  tokenDependencies?: string[];
  /** Key into componentVisualBaselines.ts for Playwright snapshot coverage */
  visualBaseline?: ComponentVisualBaselineKey;
};

/** Checklist for authoring new components — surfaced on /design/components */
export const COMPONENT_AUTHORING_CHECKLIST = [
  'Place the file in the correct layer folder (primitives, composites, features, layout, islands).',
  'Expose standard props when applicable: variant, size, class, as, data-testid (see PRIMITIVE_PROP_CONTRACT).',
  'Document props and examples in this catalog — category must match the folder path.',
  'Declare visualTier and tokenDependencies for surfaces that consume design tokens.',
  'Link visualBaseline when a Playwright snapshot exists in componentVisualBaselines.ts.',
  'Use semantic token utilities only — no raw palette names in reusable components.',
  'Include accessibility notes (focus, landmarks, ARIA) for interactive components.',
] as const;

export { PRIMITIVE_PROP_CONTRACT };

/**
 * Complete component documentation catalog
 */
export const componentDocs: ComponentDoc[] = [
  // Layout Components
  {
    name: 'NavBar',
    category: 'Layout',
    description:
      'Site chrome navigation as Astro HTML with progressive enhancement (theme, mobile menu, scroll). Does not depend on React hydration.',
    filePath: 'src/components/layout/NavBar.astro',
    examples: [
      {
        title: 'Default navigation',
        code: '<NavBar />',
      },
    ],
    accessibility: [
      'Semantic nav element',
      'Mobile menu with ARIA attributes',
      'Keyboard navigation (Tab, Enter, Escape)',
      'Focus trap in mobile drawer with return focus to burger',
      'Auto-hide on scroll down (all viewports); blocked when menu or Command Center is open',
      'Screen reader status announcements via aria-live',
    ],
    tags: ['navigation', 'layout', 'mobile-menu', 'responsive'],
    visualTier: 'quiet',
    tokenDependencies: [
      '--color-surface',
      '--color-border',
      '--color-accent',
      '--color-foreground',
    ],
    visualBaseline: 'navbar',
  },
  {
    name: 'Footer',
    category: 'Layout',
    description:
      'Site footer with navigation and social links. Quick links and social URLs are sourced from nav.json via navLinks.ts. Displays copyright information and back-to-top button.',
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
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-muted-foreground'],
    visualBaseline: 'footer',
  },

  // Feature Components
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
    name: 'AboutTimelineSection',
    category: 'Features',
    subcategory: 'About',
    description:
      'About-page timeline section. Renders dated milestones in desktop and mobile layouts with semantic list structure and keyboard access.',
    filePath: 'src/components/features/about/AboutTimelineSection.astro',
    props: [
      {
        name: 'content',
        type: 'AboutTimelineContent',
        required: true,
        description: 'Timeline kicker, title, description, and milestone items',
      },
    ],
    examples: [
      {
        title: 'Timeline section',
        code: '<AboutTimelineSection content={page.timeline} />',
      },
    ],
    accessibility: [
      'role="region" for scrollable mobile container',
      'tabindex="0" for keyboard scrolling',
      'focus-visible styles for keyboard navigation',
    ],
    tags: ['timeline', 'scrollable', 'interactive', 'achievements'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-foreground', '--color-border'],
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
    name: 'BlogPostCard',
    category: 'Features',
    subcategory: 'Blog',
    description:
      'Reusable blog post card for listings. Displays a blog post with date, title, description, tags, and read-more link in a stable grid surface.',
    filePath: 'src/components/features/blog/BlogPostCard.astro',
    props: [
      {
        name: 'post',
        type: "CollectionEntry<'blog'>",
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
    accessibility: ['Semantic article element', 'Focus-visible styles', 'Descriptive link text'],
    tags: ['blog', 'card', 'post', 'tags'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-sm', 'rounded-2xl'],
  },
  {
    name: 'EducationCard',
    category: 'Features',
    subcategory: 'About',
    description:
      'Education display card with icon and details. Displays educational background with institution, degree, and description.',
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
    accessibility: ['Semantic structure', 'Icon with proper ARIA', 'Hover effects'],
    tags: ['education', 'card', 'about'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-sm', 'rounded-2xl'],
  },

  // Media and visual components
  {
    name: 'PhotoCarousel',
    category: 'Composites',
    description:
      'Decorative scrolling photo collage for the About hero. Horizontal marquee on mobile; three vertical columns on desktop. Pauses on hover/focus-within and when reduced motion is preferred.',
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
      'Motion gated by prefers-reduced-motion; pauses on hover/focus-within',
    ],
    performance: ['Lazy loading', 'astro:assets Image', 'GPU translate3d marquees'],
    tags: ['carousel', 'photos', 'marquee', 'decorative'],
    visualTier: 'elevated',
    tokenDependencies: ['shadow-lg', 'rounded-2xl', 'duration-normal'],
  },
  {
    name: 'CoinFlipImage',
    category: 'Composites',
    description:
      'Interactive 3D coin flip portrait. Flip state is CSS `data-flipped`; optional multi-spin flourish on hover. Click toggles faces with a polite live announcement.',
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
        title: 'Multi-spin flourish',
        code: '<CoinFlipImage frontSrc="/front.jpg" backSrc="/back.jpg" alt="Front" altBack="Back" flipMultipleTimes={true} duration={1000} />',
      },
    ],
    accessibility: [
      'Button with descriptive aria-label from alt texts',
      'aria-pressed + polite live region on toggle',
      'Native keyboard activation (Enter/Space)',
      'focus-ring-interactive + reduced-motion disables transition',
    ],
    performance: [
      'Lazy loading by default',
      'Optimized AVIF/WebP srcsets from image manifests',
      'CSS transform only (no inline JS transforms)',
    ],
    tags: ['interactive', 'animation', '3d', 'flip', 'images'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', 'rounded-full', '--ease-emphasized', 'shadow-lg'],
  },
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

  // Island Components
  {
    name: 'Nav enhancement scripts',
    category: 'Islands',
    description:
      'Vanilla progressive enhancement for the Astro NavBar (theme, mobile menu, scroll, search).',
    filePath: 'src/scripts/features/ModernNavBar.ts',
    examples: [
      {
        title: 'Boot from NavBar.astro',
        code: "import { initModernNavBar } from '../../scripts/features/ModernNavBar';\ninitModernNavBar();",
      },
    ],
    accessibility: [
      'Semantic nav element (in Astro markup)',
      'Mobile menu with ARIA attributes',
      'Keyboard navigation (Tab, Enter, Escape)',
      'Focus management for menu toggle',
      'Screen reader announcements',
    ],
    tags: ['navigation', 'progressive-enhancement'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-accent', '--nav-height'],
  },
  {
    name: 'MessageContent',
    category: 'Islands',
    subcategory: 'Chat',
    description:
      'Message text content renderer with streaming indicators and quality badges. Displays chat message content with typing animations, quality scores, and citation health metrics.',
    filePath: 'src/components/islands/chat/MessageContent.tsx',
    props: [
      {
        name: 'message',
        type: 'ChatMessage',
        required: true,
        description: 'Complete chat message object with metadata',
      },
      {
        name: 'isStreaming',
        type: 'boolean',
        required: true,
        description: 'Whether message is currently being streamed',
      },
      {
        name: 'isAssistant',
        type: 'boolean',
        required: true,
        description: 'Whether this is an AI assistant message',
      },
      {
        name: 'bubbleContent',
        type: 'string',
        required: true,
        description: 'Processed message text to display',
      },
      {
        name: 'totalSources',
        type: 'number',
        required: true,
        description: 'Number of sources cited',
      },
      {
        name: 'messageTextClasses',
        type: 'string',
        required: true,
        description: 'Tailwind classes for text styling',
      },
    ],
    examples: [
      {
        title: 'Assistant message',
        code: '<MessageContent message={msg} isStreaming={false} isAssistant={true} bubbleContent="Answer..." totalSources={3} messageTextClasses="text-foreground" />',
      },
    ],
    accessibility: [
      'Streaming indicator with aria-live="assertive"',
      'Quality indicators have aria-label',
      'Visual animations use aria-hidden with SR text',
    ],
    performance: [
      'Wrapped in React.memo',
      'Conditional rendering based on state',
      'QualityIndicator separately memoized',
    ],
    tags: ['react', 'chat', 'streaming', 'quality', 'ai'],
  },
  {
    name: 'MessageSources',
    category: 'Islands',
    subcategory: 'Chat',
    description:
      'Source citations and expandable source list display. Shows citation badges, primary source, and expandable detailed source list with metadata.',
    filePath: 'src/components/islands/chat/MessageSources.tsx',
    props: [
      { name: 'sources', type: 'Source[]', required: true, description: 'Array of source objects' },
      {
        name: 'messageId',
        type: 'string',
        required: true,
        description: 'Message ID for citation linking',
      },
      {
        name: 'showAllSources',
        type: 'boolean',
        required: true,
        description: 'Whether to show expanded source list',
      },
      {
        name: 'expandedIndividualSources',
        type: 'Record<string, boolean>',
        required: true,
        description: 'Individual source expansion state',
      },
    ],
    examples: [
      {
        title: 'Citation links',
        code: '<CitationLinks sources={msg.sources} messageId={msg.id} handleOpenPrimarySource={(url) => open(url)} />',
      },
      {
        title: 'Full sources list',
        code: '<SourcesList message={msg} sources={msg.sources} showAllSources={expanded} ... />',
      },
    ],
    accessibility: [
      'aria-label="Referenced sources"',
      'Citation buttons keyboard accessible',
      'External links with rel="noopener noreferrer"',
      'Relevance scores with tooltips',
    ],
    performance: [
      'All components use React.memo',
      'Conditional rendering for expansions',
      'String utilities decode once',
    ],
    tags: ['react', 'chat', 'citations', 'sources', 'expandable'],
  },
  {
    name: 'MessageActions',
    category: 'Islands',
    subcategory: 'Chat',
    description:
      'Interactive action buttons for chat messages. Provides copy, share, feedback, and source viewing actions with analytics tracking.',
    filePath: 'src/components/islands/chat/MessageActions.tsx',
    props: [
      { name: 'message', type: 'ChatMessage', required: true, description: 'Chat message object' },
      {
        name: 'messages',
        type: 'ChatMessage[]',
        required: true,
        description: 'All conversation messages',
      },
      {
        name: 'primarySource',
        type: 'Source | null',
        required: true,
        description: 'Top cited source',
      },
      {
        name: 'copiedMessageId',
        type: 'string | null',
        required: true,
        description: 'ID of copied message for UI feedback',
      },
      {
        name: 'handleCopyMessage',
        type: '(message: ChatMessage) => void',
        required: true,
        description: 'Copy message handler',
      },
      {
        name: 'handleFeedback',
        type: '(id: string, feedback: "positive" | "negative") => void',
        required: true,
        description: 'Feedback handler',
      },
    ],
    examples: [
      {
        title: 'Message actions',
        code: '<MessageActions message={msg} messages={all} primarySource={src} copiedMessageId={copied} handleCopyMessage={copy} handleFeedback={feedback} ... />',
      },
    ],
    accessibility: [
      'All buttons have focus-visible rings',
      'Keyboard navigation (Tab, Enter)',
      'Visual state changes for actions',
      'Semantic button elements',
    ],
    performance: [
      'React.memo wrapper',
      'Analytics fire on interaction only',
      'Sub-components optimized',
    ],
    tags: ['react', 'chat', 'actions', 'clipboard', 'feedback', 'analytics'],
  },
  {
    name: 'MessageCTAs',
    category: 'Islands',
    subcategory: 'Chat',
    description:
      'Contextual call-to-actions and follow-up suggestions. Shows relevant CTAs based on query context and generates dynamic follow-up questions.',
    filePath: 'src/components/islands/chat/MessageCTAs.tsx',
    props: [
      { name: 'message', type: 'ChatMessage', required: true, description: 'Chat message object' },
      {
        name: 'messages',
        type: 'ChatMessage[]',
        required: true,
        description: 'Conversation history',
      },
      {
        name: 'sources',
        type: 'Source[]',
        required: true,
        description: 'Cited sources for suggestions',
      },
      {
        name: 'setInputValue',
        type: '(value: string) => void',
        required: false,
        description: 'Set input field value',
      },
      {
        name: 'sendQuery',
        type: '(query: string) => void',
        required: false,
        description: 'Send query function',
      },
    ],
    examples: [
      {
        title: 'Matched CTA',
        code: '<MatchedCTA message={msg} messages={all} sources={srcs} />',
      },
      {
        title: 'Follow-up suggestions',
        code: '<FollowUpSuggestions sources={srcs} setInputValue={setInput} sendQuery={send} />',
      },
    ],
    accessibility: [
      'CTA buttons with focus-visible',
      'Keyboard navigation supported',
      'Icon SVGs use aria-hidden',
      'Suggestion chips have clear labels',
    ],
    performance: [
      'All components use React.memo',
      'CTA matching runs once per message',
      'Dynamic suggestions on-demand',
    ],
    tags: ['react', 'chat', 'cta', 'suggestions', 'engagement', 'analytics'],
  },

  // Primitive Components
  {
    name: 'Badge',
    category: 'Primitives',
    description: 'Simple badge component for tags, labels, and semantic status indicators.',
    filePath: 'src/components/primitives/Badge.astro',
    props: [
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'outline' | 'subtle' | 'success' | 'warning' | 'error'",
        required: false,
        default: "'secondary'",
        description: 'Semantic badge variant',
      },
      {
        name: 'size',
        type: "'xs' | 'sm' | 'md'",
        required: false,
        default: "'sm'",
        description: 'Badge size preset',
      },
      { name: 'class', type: 'string', required: false, description: 'Additional CSS classes' },
    ],
    examples: [
      {
        title: 'Basic badge',
        code: '<Badge>TypeScript</Badge>',
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

  // Composite Components
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
        type: "'none' | 'lift' | 'scale' | 'glow'",
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
    name: 'FeatureCard',
    category: 'Composites',
    description:
      'Semantic feature surface with token-backed color variants. Use for marketing/feature grids instead of page-specific card styles.',
    filePath: 'src/components/composites/FeatureCard.astro',
    props: [
      {
        name: 'variant',
        type: "'accent' | 'primary' | 'success' | 'warning' | 'info' | 'error'",
        required: false,
        default: "'accent'",
        description: 'Semantic color variant',
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
      '--color-success',
      '--color-surface',
      'rounded-2xl',
      'shadow-sm',
    ],
  },
  {
    name: 'StatsCard',
    category: 'Composites',
    description:
      'Metric highlight card with optional trend indicator. Uses container queries for responsive stat layouts.',
    filePath: 'src/components/composites/StatsCard.astro',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Metric label' },
      { name: 'value', type: 'string', required: true, description: 'Displayed metric value' },
      {
        name: 'variant',
        type: "'default' | 'elevated' | 'glass' | 'subtle'",
        required: false,
        default: "'default'",
        description: 'Surface preset',
      },
    ],
    examples: [
      {
        title: 'Elevated stat',
        code: '<StatsCard label="Projects" value="12+" variant="elevated" />',
      },
    ],
    tags: ['card', 'metrics', 'stats', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-lg', '@container'],
  },

  // Additional Primitives
  {
    name: 'SectionHeading',
    category: 'Primitives',
    description: 'Standardized section heading with optional kicker, title, and description slots.',
    filePath: 'src/components/primitives/SectionHeading.astro',
    examples: [
      { title: 'Section intro', code: '<SectionHeading kicker="Work" title="Recent Projects" />' },
    ],
    tags: ['heading', 'typography', 'section', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-foreground', '--color-muted-foreground', '--fs-h2'],
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
  {
    name: 'Skeleton',
    category: 'Primitives',
    description: 'Loading placeholder with pulse animation for async content surfaces.',
    filePath: 'src/components/primitives/Skeleton.astro',
    examples: [{ title: 'Loading state', code: '<Skeleton class="h-8 w-48" />' }],
    tags: ['loading', 'placeholder', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface-subtle', '--duration'],
  },
  {
    name: 'SkillBadge',
    category: 'Primitives',
    description: 'Compact badge for displaying skills or technology tags.',
    filePath: 'src/components/primitives/SkillBadge.astro',
    examples: [{ title: 'Skill tag', code: '<SkillBadge>TypeScript</SkillBadge>' }],
    tags: ['badge', 'skill', 'tag', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface-subtle', '--color-border', 'rounded-full'],
  },
  {
    name: 'SocialLink',
    category: 'Primitives',
    description:
      'Social profile link with icon and label. Supports LinkedIn, GitHub, email, and Microsoft Learn icons.',
    filePath: 'src/components/primitives/SocialLink.astro',
    props: [
      { name: 'href', type: 'string', required: true, description: 'Profile or mailto URL' },
      {
        name: 'icon',
        type: "'linkedin' | 'github' | 'email' | 'microsoft-learn'",
        required: true,
        description: 'Icon variant',
      },
      { name: 'label', type: 'string', required: true, description: 'Accessible link label' },
    ],
    examples: [
      {
        title: 'GitHub link',
        code: '<SocialLink href="https://github.com/blakeox" icon="github" label="GitHub" />',
      },
    ],
    accessibility: ['Descriptive aria-label', 'External link indication for screen readers'],
    tags: ['social', 'link', 'icon', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-border', '--color-accent', 'rounded-lg'],
  },
  {
    name: 'FloatingBlur',
    category: 'Primitives',
    description:
      'Decorative blurred gradient orb for page backgrounds. Respects reduced-motion preferences.',
    filePath: 'src/components/primitives/FloatingBlur.astro',
    examples: [
      {
        title: 'Hero background',
        code: '<FloatingBlur size="xl" color="accent" position="top-left" />',
      },
    ],
    tags: ['decorative', 'background', 'gradient', 'primitive'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-accent', '--blur-lg'],
  },
  {
    name: 'ProficiencyLogo',
    category: 'Primitives',
    description: 'Technology proficiency logo with optimized AVIF/WebP image loading.',
    filePath: 'src/components/primitives/ProficiencyLogo.astro',
    examples: [
      { title: 'Tech logo', code: '<ProficiencyLogo name="typescript" alt="TypeScript" />' },
    ],
    tags: ['logo', 'image', 'technology', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['rounded-lg'],
  },
  {
    name: 'DateDisplay',
    category: 'Primitives',
    description: 'Formatted date display with semantic time element.',
    filePath: 'src/components/primitives/DateDisplay.astro',
    examples: [{ title: 'Publication date', code: '<DateDisplay date={post.data.pubDate} />' }],
    tags: ['date', 'time', 'typography', 'primitive'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-muted-foreground'],
  },

  // Additional Composites
  {
    name: 'Hero',
    category: 'Composites',
    description: 'Full-width hero band with title, description, and optional CTA slot.',
    filePath: 'src/components/composites/Hero.astro',
    examples: [
      {
        title: 'Page hero',
        code: '<Hero title="Projects" description="Case studies and shipped work." />',
      },
    ],
    tags: ['hero', 'marketing', 'composite'],
    visualTier: 'expressive',
    tokenDependencies: ['--gradient-primary', '--color-foreground', '--fs-h1'],
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
    name: 'FeatureGrid',
    category: 'Composites',
    description: 'Responsive grid layout for FeatureItem or FeatureCard children.',
    filePath: 'src/components/composites/FeatureGrid.astro',
    examples: [
      { title: 'Feature grid', code: '<FeatureGrid><FeatureCard title="Fast" /></FeatureGrid>' },
    ],
    tags: ['grid', 'features', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['@container', 'gap-6'],
  },
  {
    name: 'OutcomeCard',
    category: 'Composites',
    description: 'Bullet outcome list card used on project detail pages for impact summaries.',
    filePath: 'src/components/composites/OutcomeCard.astro',
    examples: [{ title: 'Outcomes', code: '<OutcomeCard title="Results" items={outcomes} />' }],
    tags: ['card', 'outcomes', 'project', 'composite'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-sm', 'rounded-2xl'],
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

  // Home Feature Sections
  {
    name: 'HomeHeroSection',
    category: 'Features',
    subcategory: 'Home',
    description: 'Homepage hero with author photo, tagline, description, and primary CTAs.',
    filePath: 'src/components/features/home/HomeHeroSection.astro',
    examples: [
      {
        title: 'Home hero',
        code: '<HomeHeroSection author={siteConfig.author} description={tagline} />',
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
    name: 'ResumeHighlightCard',
    category: 'Features',
    subcategory: 'Home',
    description: 'Card displaying a resume highlight with icon, title, and description.',
    filePath: 'src/components/features/home/ResumeHighlightCard.astro',
    examples: [
      {
        title: 'Highlight card',
        code: '<ResumeHighlightCard title="Leadership" description="Led cross-functional teams." />',
      },
    ],
    tags: ['home', 'resume', 'card'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-md', 'rounded-2xl'],
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

  // Blog Feature Sections
  {
    name: 'BlogCard',
    category: 'Features',
    subcategory: 'Blog',
    description: 'Compact blog post card variant for grid layouts.',
    filePath: 'src/components/features/blog/BlogCard.astro',
    examples: [{ title: 'Blog card', code: '<BlogCard post={blogEntry} />' }],
    tags: ['blog', 'card', 'listing'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-sm', 'rounded-2xl'],
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

  // Project Feature Sections
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

  // About Feature Sections
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
    name: 'AchievementCard',
    category: 'Features',
    subcategory: 'About',
    description: 'Card displaying a professional achievement with icon and description.',
    filePath: 'src/components/features/about/AchievementCard.astro',
    examples: [
      {
        title: 'Achievement',
        code: '<AchievementCard title="Certification" description="Details..." />',
      },
    ],
    tags: ['about', 'achievement', 'card'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', 'shadow-sm', 'rounded-2xl'],
  },
  {
    name: 'TimelineCard',
    category: 'Features',
    subcategory: 'About',
    description: 'Individual timeline milestone card with year, title, and achievements list.',
    filePath: 'src/components/features/about/TimelineCard.astro',
    examples: [
      {
        title: 'Timeline entry',
        code: '<TimelineCard year="2024" title="Role" achievements={[]} />',
      },
    ],
    tags: ['about', 'timeline', 'card'],
    visualTier: 'elevated',
    tokenDependencies: ['--color-surface', '--color-border', '--color-accent'],
  },
  {
    name: 'AboutSocial',
    category: 'Features',
    subcategory: 'About',
    description: 'About page social profiles section with icon links.',
    filePath: 'src/components/features/about/AboutSocial.astro',
    examples: [{ title: 'Social profiles', code: '<AboutSocial social={socialData} />' }],
    tags: ['about', 'social', 'links'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-accent'],
  },

  // Contact Feature Sections
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

  // Search Feature Components
  {
    name: 'SearchBar',
    category: 'Features',
    subcategory: 'Search',
    description: 'Inline search input component used within the Command Center overlay.',
    filePath: 'src/components/features/search/SearchBar.astro',
    examples: [{ title: 'Search input', code: '<SearchBar placeholder="Search..." />' }],
    tags: ['search', 'input'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-field-bg', '--color-border', '--focus-ring-color'],
  },

  // Additional Islands
  {
    name: 'ContactFormIsland',
    category: 'Islands',
    description:
      'React island for the contact form with validation, submission, and success/error states.',
    filePath: 'src/components/islands/ContactFormIsland.tsx',
    examples: [{ title: 'Contact form', code: '<ContactFormIsland client:load />' }],
    accessibility: ['Form labels associated with inputs', 'Error messages announced via aria-live'],
    tags: ['react', 'island', 'form', 'contact'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-field-bg', '--color-border', '--color-error', '--color-success'],
  },
  {
    name: 'AIChatIsland',
    category: 'Islands',
    description:
      'React island powering the AI chat assistant with streaming responses and source citations.',
    filePath: 'src/components/islands/AIChatIsland.tsx',
    examples: [{ title: 'AI chat', code: '<AIChatIsland client:load />' }],
    accessibility: ['Dialog with aria-modal', 'Keyboard shortcut support', 'Focus management'],
    tags: ['react', 'island', 'chat', 'ai'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', '--color-glass', '--color-accent', '--z-chat'],
  },
  {
    name: 'Theme FOUC script',
    category: 'Islands',
    description:
      'Inline FOUC-prevention script from getThemeFoucPreventionScript() in BaseLayout (not a React island).',
    filePath: 'src/lib/theme.ts',
    examples: [
      {
        title: 'Theme init',
        code: '<script is:inline set:html={getThemeFoucPreventionScript()} />',
      },
    ],
    tags: ['theme', 'inline-script'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-background', '--color-foreground'],
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

/** Components linked to a Playwright visual baseline snapshot */
export function getComponentsWithVisualBaseline(): ComponentDoc[] {
  return componentDocs.filter((doc) => doc.visualBaseline);
}
