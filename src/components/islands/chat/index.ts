/**
 * Chat components barrel export
 * 
 * Modular components extracted from AIChatIsland for better maintainability.
 */

// Types
export type {
	ChatState,
	FeedbackAnalytics,
	ChatHeaderProps,
	ChatAdvancedControlsProps,
	ChatGuidedPromptsProps,
	ChatRecentQueriesProps,
	ChatDigestProps,
	ChatAnalyticsProps,
	ChatQuickActionsProps,
	ChatMessageBubbleProps,
	ChatMessageListProps,
	ChatInputProps,
	ChatStatusIndicatorsProps,
	ChatFallbackResultsProps,
	ChatNewChatPromptProps,
	ChatLauncherProps,
} from './types';

// Components
export { ChatHeader } from './ChatHeader';
export { ChatAdvancedControls } from './ChatAdvancedControls';
export { ChatGuidedPrompts } from './ChatGuidedPrompts';
export { ChatRecentQueries } from './ChatRecentQueries';
export { ChatDigest } from './ChatDigest';
export { ChatAnalytics } from './ChatAnalytics';
export { ChatQuickActions } from './ChatQuickActions';
export { ChatMessageBubble } from './ChatMessageBubble';
export { ChatInput } from './ChatInput';
export { ChatStatusIndicators } from './ChatStatusIndicators';
export { ChatFallbackResults } from './ChatFallbackResults';
export { ChatNewChatPrompt } from './ChatNewChatPrompt';
export { ChatLauncher } from './ChatLauncher';
