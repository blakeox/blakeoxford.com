/**
 * AIChatIsland - Refactored AI Chat Widget
 * 
 * A modular React island component that provides AI-powered chat functionality.
 * This component orchestrates the extracted sub-components for a clean architecture.
 * 
 * @module AIChatIsland
 */
import { useEffect } from 'react';

import { useAIChatController } from '../../lib/hooks';
import {
	ChatHeader,
	ChatAdvancedControls,
	ChatGuidedPrompts,
	ChatRecentQueries,
	ChatDigest,
	ChatAnalytics,
	ChatQuickActions,
	ChatMessageBubble,
	ChatInput,
	ChatStatusIndicators,
	ChatFallbackResults,
	ChatNewChatPrompt,
	ChatLauncher,
} from './chat';

/**
 * Typing indicator component for when another user is typing
 */
function TypingIndicator() {
	return (
		<div className="flex flex-col gap-2 items-start text-left" aria-live="polite" aria-label="AI is typing">
			<div className="rounded-2xl bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90 px-4 py-3 shadow-sm border border-[color:var(--border)]/20">
				<div className="flex items-center gap-2">
					<div className="flex gap-1">
						<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:0ms]" aria-hidden="true" />
						<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:150ms]" aria-hidden="true" />
						<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:300ms]" aria-hidden="true" />
					</div>
					<span className="text-xs text-[color:var(--fg)]/60">AI is thinking...</span>
				</div>
			</div>
		</div>
	);
}

/**
 * Scroll to latest button
 */
function ScrollToLatestButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="pointer-events-auto absolute bottom-5 right-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[color:var(--fg)]/70 shadow-sm backdrop-blur transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
			aria-label="Jump to latest message"
		>
			<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
				<path strokeLinecap="round" strokeLinejoin="round" d="m5 8 5 5 5-5" />
			</svg>
			<span>Jump to latest</span>
		</button>
	);
}

/**
 * Main AIChatIsland component
 * 
 * This component serves as the orchestrator for the AI chat widget,
 * composing smaller components for each section of the UI.
 */
export default function AIChatIsland() {
	const controller = useAIChatController();

	// Destructure for cleaner code
	const {
		isOpen,
		messages,
		inputValue,
		setInputValue,
		chatState,
		loadingPhase,
		error,
		setError,
		useMemory,
		streamingMessageId,
		sessionStartTime,
		fallbackResults,
		retryCount,
		setRetryCount,
		lastFailedQuery,
		siteHostname,
		panelRef,
		inputRef,
		scrollContainerRef,
		launcherRef,
		messagesRef,
		typingTimeoutRef,
		voiceSupported,
		isListening,
		interimTranscript,
		wsConnected,
		activeUsers,
		isOtherUserTyping,
		wsRef,
		showDigest,
		showAnalytics,
		showAdvancedControls,
		showFallbackSuggestions,
		showScrollToLatest,
		expandedSources,
		expandedIndividualSources,
		toggleDigest,
		toggleAnalytics,
		toggleAdvancedControls,
		setShowFallbackSuggestions,
		setComposerFocused,
		toggleExpandedSource,
		toggleIndividualSource,
		openChat,
		closeChat,
		touchStartY,
		touchCurrentY,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		canRetry,
		lastQueryValue,
		sourceRefs,
		scrollToLatest,
		recentQueries,
		conversationDigest,
		feedbackAnalytics,
		guidedPromptVisible,
		floatingLabelActive,
		canStartNewChat,
		copiedMessageId,
		copiedShareUrl,
		copyWithFeedback,
		clearConversation,
		startNewChat,
		handleFeedback,
		handleCopyMessage,
		handleOpenPrimarySource,
		handleExportConversation,
		toggleMemory,
		toggleVoiceInput,
		handleTextareaKeyDown,
		sendQuery,
		handleSubmit,
		handleReplayQuery,
		handleGuidedPrompt,
		visibleFallbackResults,
		hasMoreFallbackResults,
	} = controller;

	// Calculate drag state
	const isDragging = touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY;
	const dragOffset = isDragging ? Math.min(touchCurrentY - touchStartY, 200) : 0;
	const dragOpacity = isDragging ? Math.max(0.5, 1 - (touchCurrentY - touchStartY) / 400) : 1;

	// Handle drag animation
	useEffect(() => {
		const panelElement = panelRef.current;
		if (!panelElement) return;

		if (isDragging) {
			panelElement.style.transform = `translateY(${dragOffset}px)`;
			panelElement.style.opacity = dragOpacity.toString();
			panelElement.dataset.dragging = 'true';
		} else {
			panelElement.style.transform = '';
			panelElement.style.opacity = '';
			panelElement.dataset.dragging = 'false';
		}
	}, [dragOffset, dragOpacity, isDragging, isOpen, panelRef]);

	return (
		<div
			className="ai-chat-wrapper pointer-events-none fixed bottom-4 right-4 z-[1050] flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6"
			data-ai-chat-open={isOpen ? 'true' : 'false'}
		>
			{/* Launcher Button */}
			<ChatLauncher
				isOpen={isOpen}
				launcherRef={launcherRef}
				openChat={openChat}
				closeChat={closeChat}
			/>

			{/* Chat Panel */}
			<div
				ref={panelRef}
				className={`ai-chat-panel pointer-events-auto w-[min(95vw,24rem)] overflow-hidden rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/80 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.65)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/80 transition-transform duration-200 ease-out sm:w-[min(85vw,28rem)] ${
					isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
				}`}
				data-ai-chat-panel
				data-ai-visible={isOpen ? 'true' : 'false'}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ai-chat-heading"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Header */}
				<ChatHeader
					wsConnected={wsConnected}
					activeUsers={activeUsers}
					voiceSupported={voiceSupported}
					isListening={isListening}
					showAdvancedControls={showAdvancedControls}
					toggleVoiceInput={toggleVoiceInput}
					toggleAdvancedControls={toggleAdvancedControls}
					closeChat={closeChat}
				/>

				{/* Advanced Controls */}
				<ChatAdvancedControls
					showAdvancedControls={showAdvancedControls}
					useMemory={useMemory}
					showDigest={showDigest}
					showAnalytics={showAnalytics}
					messages={messages}
					feedbackAnalytics={feedbackAnalytics}
					toggleMemory={toggleMemory}
					toggleDigest={toggleDigest}
					toggleAnalytics={toggleAnalytics}
					clearConversation={clearConversation}
					handleExportConversation={handleExportConversation}
				/>

				{/* Guided Prompts */}
				<ChatGuidedPrompts
					visible={guidedPromptVisible}
					onSelectPrompt={handleGuidedPrompt}
				/>

				{/* Recent Queries */}
				<ChatRecentQueries
					queries={recentQueries}
					onReplayQuery={handleReplayQuery}
				/>

				{/* Conversation Digest */}
				<ChatDigest
					show={showDigest}
					digest={conversationDigest}
				/>

				{/* Analytics */}
				<ChatAnalytics
					show={showAnalytics}
					messages={messages}
					sessionStartTime={sessionStartTime}
					feedbackAnalytics={feedbackAnalytics}
				/>

				{/* Messages Container */}
				<div className="relative">
					<div
						ref={scrollContainerRef}
						className="flex max-h-80 flex-col gap-4 overflow-y-auto px-4 py-4"
						aria-live="polite"
						data-ai-chat-transcript
					>
						{/* Empty State with Quick Actions */}
						{messages.length === 0 && chatState === 'ready' && (
							<ChatQuickActions
								onAction={(query) => sendQuery(query)}
								setInputValue={setInputValue}
							/>
						)}

						{/* Messages */}
						{messages.map((message) => (
							<ChatMessageBubble
								key={message.id}
								message={message}
								isStreaming={streamingMessageId === message.id}
								siteHostname={siteHostname}
								expandedSources={expandedSources}
								expandedIndividualSources={expandedIndividualSources}
								copiedMessageId={copiedMessageId}
								copiedShareUrl={copiedShareUrl}
								messages={messages}
								messagesRef={messagesRef}
								sourceRefs={sourceRefs}
								toggleExpandedSource={toggleExpandedSource}
								toggleIndividualSource={toggleIndividualSource}
								handleFeedback={handleFeedback}
								handleCopyMessage={handleCopyMessage}
								handleOpenPrimarySource={handleOpenPrimarySource}
								setInputValue={setInputValue}
								sendQuery={sendQuery}
								copyWithFeedback={copyWithFeedback}
							/>
						))}

						{/* Typing Indicator */}
						{isOtherUserTyping && wsConnected && <TypingIndicator />}
					</div>

					{/* Scroll to Latest */}
					{showScrollToLatest && <ScrollToLatestButton onClick={scrollToLatest} />}
				</div>

				{/* Status Indicators */}
				<ChatStatusIndicators
					chatState={chatState}
					loadingPhase={loadingPhase}
					isListening={isListening}
					interimTranscript={interimTranscript}
					error={error}
					lastQueryValue={lastQueryValue}
					lastFailedQuery={lastFailedQuery}
					retryCount={retryCount}
					canRetry={canRetry}
					setError={setError}
					setRetryCount={setRetryCount}
					sendQuery={sendQuery}
				/>

				{/* Fallback Results */}
				<ChatFallbackResults
					fallbackResults={fallbackResults}
					visibleFallbackResults={visibleFallbackResults}
					hasMoreFallbackResults={hasMoreFallbackResults}
					showFallbackSuggestions={showFallbackSuggestions}
					setShowFallbackSuggestions={setShowFallbackSuggestions}
				/>

				{/* New Chat Prompt */}
				<ChatNewChatPrompt
					canStartNewChat={canStartNewChat}
					startNewChat={startNewChat}
				/>

				{/* Input Form */}
				<ChatInput
					inputValue={inputValue}
					chatState={chatState}
					floatingLabelActive={floatingLabelActive}
					inputRef={inputRef}
					wsRef={wsRef}
					typingTimeoutRef={typingTimeoutRef}
					setInputValue={setInputValue}
					setComposerFocused={setComposerFocused}
					handleTextareaKeyDown={handleTextareaKeyDown}
					handleSubmit={handleSubmit}
				/>
			</div>
		</div>
	);
}
