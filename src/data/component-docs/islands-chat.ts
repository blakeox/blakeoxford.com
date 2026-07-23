/**
 * Chat island component documentation
 */

import type { ComponentDoc } from './types';

export const islandChatDocs: ComponentDoc[] = [
  {
    name: 'MessageContent',
    category: 'Islands',
    subcategory: 'Chat',
    description:
      'Message text content renderer with streaming indicators and quality badges. Displays chat message content with typing animations, quality scores, and citation health metrics.',
    filePath: 'src/features/chat/components/MessageContent.tsx',
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
    filePath: 'src/features/chat/components/MessageSources.tsx',
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
    filePath: 'src/features/chat/components/MessageActions.tsx',
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
    filePath: 'src/features/chat/components/MessageCTAs.tsx',
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
  {
    name: 'AIChatIsland',
    category: 'Islands',
    description:
      'React island powering the AI chat assistant with streaming responses and source citations.',
    filePath: 'src/features/chat/AIChatIsland.tsx',
    examples: [{ title: 'AI chat', code: '<AIChatIsland client:load />' }],
    accessibility: ['Dialog with aria-modal', 'Keyboard shortcut support', 'Focus management'],
    tags: ['react', 'island', 'chat', 'ai'],
    visualTier: 'expressive',
    tokenDependencies: ['--color-surface', '--color-glass', '--color-accent', '--z-chat'],
  },
];
