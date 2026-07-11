/**
 * AIChatIsland - Refactored AI Chat Widget
 * 
 * A modular React island component that provides AI-powered chat functionality.
 * This component orchestrates the extracted sub-components for a clean architecture.
 * 
 * @module AIChatIsland
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useAIChatController } from '../../lib/hooks';
import { useOverlayScrollLock } from '../../hooks/useOverlayScrollLock';
import { OverlayShell } from '../../features/overlay';
import {
	ChatHeader,
	ChatAdvancedControls,
	ChatRecentQueries,
	ChatDigest,
	ChatAnalytics,
	ChatQuickActions,
	ChatMessageBubble,
	ChatInput,
	ChatStatusIndicators,
	ChatFallbackResults,
	TypingIndicator,
	ScrollToLatestButton,
} from './chat';

export default function AIChatIsland() {
	const controller = useAIChatController();
	const hasCheckedInitialOpenRef = useRef(false);

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
		visibleFallbackResults,
		hasMoreFallbackResults,
	} = controller;

	useOverlayScrollLock(isOpen);

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
					try { focusInput(); } catch (err) { /* noop - focus best-effort */ }
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
		if (hasCheckedInitialOpenRef.current) return;
		hasCheckedInitialOpenRef.current = true;
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

	const latestAssistantId = [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')?.id;
	const isEmptyConversation =
		messages.length === 0 ||
		(messages.length === 1 && messages[0]?.id === 'welcome');
	const transcriptMessages = isEmptyConversation
		? []
		: messages.filter((message) => message.id !== 'welcome');

	if (typeof document === 'undefined') return null;

	const panel = (
		<OverlayShell
			isOpen={isOpen}
			onClose={closeChat}
			labelledBy="ai-chat-heading"
			panelRef={panelRef}
			variant="ask"
			rootProps={{
				'data-ai-chat-overlay': true,
				className: 'ai-chat-overlay z-chat',
			}}
			onPanelClick={(event) => event.stopPropagation()}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
				<ChatHeader
					wsConnected={wsConnected}
					activeUsers={activeUsers}
					voiceSupported={voiceSupported}
					isListening={isListening}
					showAdvancedControls={showAdvancedControls}
					useMemory={useMemory}
					canStartNewChat={canStartNewChat}
					hasMessages={transcriptMessages.length > 0}
					toggleVoiceInput={toggleVoiceInput}
					toggleAdvancedControls={toggleAdvancedControls}
					toggleMemory={toggleMemory}
					clearConversation={clearConversation}
					handleExportConversation={handleExportConversation}
					startNewChat={startNewChat}
					closeChat={closeChat}
				/>

				<ChatAdvancedControls
					showAdvancedControls={showAdvancedControls}
					useMemory={useMemory}
					showDigest={showDigest}
					showAnalytics={showAnalytics}
					messages={transcriptMessages}
					feedbackAnalytics={feedbackAnalytics}
					toggleMemory={toggleMemory}
					toggleDigest={toggleDigest}
					toggleAnalytics={toggleAnalytics}
					clearConversation={clearConversation}
					handleExportConversation={handleExportConversation}
				/>

				{isEmptyConversation ? (
					<ChatRecentQueries queries={recentQueries} onReplayQuery={handleReplayQuery} />
				) : null}

				<ChatDigest show={showDigest} digest={conversationDigest} />

				<ChatAnalytics
					show={showAnalytics}
					messages={transcriptMessages}
					sessionStartTime={sessionStartTime}
					feedbackAnalytics={feedbackAnalytics}
				/>

				<div className="relative min-h-0 flex-1 overflow-hidden">
					<div
						ref={scrollContainerRef}
						className="flex max-h-[min(52dvh,26rem)] flex-col gap-3 overflow-y-auto px-3 py-3 sm:max-h-[min(58dvh,28rem)] sm:px-4"
						aria-live="polite"
						data-ai-chat-transcript
					>
						{isEmptyConversation && chatState === 'ready' ? (
							<ChatQuickActions
								onAction={(query) => sendQuery(query)}
								setInputValue={setInputValue}
							/>
						) : null}

						{transcriptMessages.map((message) => (
							<ChatMessageBubble
								key={message.id}
								message={message}
								isStreaming={streamingMessageId === message.id}
								siteHostname={siteHostname}
								expandedSources={expandedSources}
								expandedIndividualSources={expandedIndividualSources}
								copiedMessageId={copiedMessageId}
								copiedShareUrl={copiedShareUrl}
								messages={transcriptMessages}
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
								isLatestAssistant={message.id === latestAssistantId}
							/>
						))}

						{isOtherUserTyping && wsConnected ? <TypingIndicator /> : null}
					</div>

					{showScrollToLatest ? <ScrollToLatestButton onClick={scrollToLatest} /> : null}
				</div>

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

				<ChatFallbackResults
					fallbackResults={fallbackResults}
					visibleFallbackResults={visibleFallbackResults}
					hasMoreFallbackResults={hasMoreFallbackResults}
					showFallbackSuggestions={showFallbackSuggestions}
					setShowFallbackSuggestions={setShowFallbackSuggestions}
				/>

				<ChatInput
					inputValue={inputValue}
					chatState={chatState}
					inputRef={inputRef}
					wsRef={wsRef}
					typingTimeoutRef={typingTimeoutRef}
					setInputValue={setInputValue}
					setComposerFocused={setComposerFocused}
					handleTextareaKeyDown={handleTextareaKeyDown}
					handleSubmit={handleSubmit}
				/>
		</OverlayShell>
	);

	return createPortal(panel, document.body);
}
