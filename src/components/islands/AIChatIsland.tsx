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
    TypingIndicator,
    ScrollToLatestButton,
} from './chat';
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
		_launcherRef,
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
			focusInput,
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

	// Listen for deterministic open/close events from the early launcher (synchronous handshake)
	useEffect(() => {
		function handleStateEvent(e: Event) {
			try {
				// Prefer detail.open if available
				const detail = (e as CustomEvent)?.detail;
				const open = detail && typeof detail.open === 'boolean' ? detail.open : null;
				if (open === true) {
					openChat();
					// Ensure input receives focus when island has mounted
					try { focusInput(); } catch (_err) { /* noop - focus best-effort */ }
				} else if (open === false) {
					closeChat();
				}
			} catch (err) {
				/* noop - non-fatal state handler */
			}
		}

		window.addEventListener('ai-chat:state', handleStateEvent as EventListener);
		// also support legacy ai-chat:open event
		window.addEventListener('ai-chat:open', handleStateEvent as EventListener);
		return () => {
			window.removeEventListener('ai-chat:state', handleStateEvent as EventListener);
			window.removeEventListener('ai-chat:open', handleStateEvent as EventListener);
		};
	}, [openChat, closeChat, focusInput]);

	// On mount, if the server-rendered wrapper already indicates open, ensure we run open/focus.
	useEffect(() => {
		try {
			const wrapper = document.querySelector('[data-ai-chat-open]');
			if (wrapper && wrapper.getAttribute('data-ai-chat-open') === 'true') {
				openChat();
				try { focusInput(); } catch (err) { /* noop - best-effort focus */ }
			}
		} catch (e) {
			/* noop - defensive DOM access */
		}
	}, [openChat, focusInput]);

	// Sync wrapper attribute when isOpen changes (for inline script compatibility)
	useEffect(() => {
		try {
			const wrapper = document.querySelector('[data-ai-chat-open]');
			if (wrapper) {
				wrapper.setAttribute('data-ai-chat-open', isOpen ? 'true' : 'false');
				if (isOpen) {
					wrapper.classList.remove('pointer-events-none');
				} else {
					wrapper.classList.add('pointer-events-none');
				}
			}
		} catch (e) {
			/* noop - defensive DOM sync */
		}
	}, [isOpen]);

	return (
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
	);
}
