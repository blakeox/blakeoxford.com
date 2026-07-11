/**
 * AIChatIsland — docked corner Ask companion.
 * Stays over the page so visitors can chat while reading.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ChatDock } from '../../features/chat/ChatDock';
import { formatPageContextLabel, getPageContext } from '../../lib/chat';
import { useAIChatController } from '../../lib/hooks';
import {
	ChatHeader,
	ChatAdvancedControls,
	ChatDigest,
	ChatAnalytics,
	ChatQuickActions,
	ChatMessageBubble,
	ChatInput,
	ChatStatusIndicators,
	TypingIndicator,
	ScrollToLatestButton,
} from './chat';

export default function AIChatIsland() {
	const controller = useAIChatController();
	const hasCheckedInitialOpenRef = useRef(false);
	const [pageLabel, setPageLabel] = useState('Site assistant');
	const [freshNotice, setFreshNotice] = useState(false);
	const freshTimerRef = useRef<number | null>(null);

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
		showScrollToLatest,
		expandedSources,
		expandedIndividualSources,
		toggleDigest,
		toggleAnalytics,
		toggleAdvancedControls,
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
	} = controller;

	useEffect(() => {
		const syncLabel = () => {
			setPageLabel(formatPageContextLabel(getPageContext()));
		};
		syncLabel();
		document.addEventListener('astro:page-load', syncLabel);
		return () => document.removeEventListener('astro:page-load', syncLabel);
	}, [isOpen]);

	useEffect(() => {
		return () => {
			if (freshTimerRef.current !== null) {
				window.clearTimeout(freshTimerRef.current);
			}
		};
	}, []);

	const handleStartNewChat = () => {
		startNewChat();
		setFreshNotice(true);
		if (freshTimerRef.current !== null) {
			window.clearTimeout(freshTimerRef.current);
		}
		freshTimerRef.current = window.setTimeout(() => {
			setFreshNotice(false);
			freshTimerRef.current = null;
		}, 2200);
	};

	const isDragging = touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY;
	const dragOffset = isDragging ? Math.min(touchCurrentY - touchStartY, 200) : 0;
	const dragOpacity = isDragging ? Math.max(0.5, 1 - (touchCurrentY - touchStartY) / 400) : 1;

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

	useEffect(() => {
		function handleStateEvent(e: Event) {
			try {
				const detail = (e as CustomEvent)?.detail;
				const open = detail && typeof detail.open === 'boolean' ? detail.open : null;
				if (open === true) {
					openChat();
					try {
						focusInput();
					} catch {
						/* noop */
					}
				} else if (open === false) {
					closeChat();
				}
			} catch {
				/* noop */
			}
		}

		window.addEventListener('ai-chat:state', handleStateEvent as EventListener);
		window.addEventListener('ai-chat:open', handleStateEvent as EventListener);
		return () => {
			window.removeEventListener('ai-chat:state', handleStateEvent as EventListener);
			window.removeEventListener('ai-chat:open', handleStateEvent as EventListener);
		};
	}, [openChat, closeChat, focusInput]);

	useEffect(() => {
		if (hasCheckedInitialOpenRef.current) return;
		hasCheckedInitialOpenRef.current = true;
		try {
			const wrapper = document.querySelector('[data-ai-chat-open]');
			if (wrapper && wrapper.getAttribute('data-ai-chat-open') === 'true') {
				openChat();
				try {
					focusInput();
				} catch {
					/* noop */
				}
			}
		} catch {
			/* noop */
		}
	}, [openChat, focusInput]);

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
		} catch {
			/* noop */
		}
	}, [isOpen]);

	const latestAssistantId = useMemo(
		() => [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')?.id,
		[messages],
	);
	const isEmptyConversation =
		messages.length === 0 || (messages.length === 1 && messages[0]?.id === 'welcome');
	const transcriptMessages = isEmptyConversation
		? []
		: messages.filter((message) => message.id !== 'welcome');
	const showQuickActions =
		isEmptyConversation && (chatState === 'ready' || chatState === 'idle') && !error;

	if (typeof document === 'undefined') return null;

	const panel = (
		<ChatDock
			isOpen={isOpen}
			onClose={closeChat}
			labelledBy="ai-chat-heading"
			panelRef={panelRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<ChatHeader
				pageLabel={pageLabel}
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
				startNewChat={handleStartNewChat}
				closeChat={closeChat}
			/>

			{freshNotice ? (
				<p
					className="shrink-0 border-b border-border/30 bg-surface-subtle/50 px-3.5 py-1.5 text-xxs text-muted-foreground sm:px-4"
					role="status"
				>
					Started fresh
				</p>
			) : null}

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
					className="flex h-full min-h-[min(40dvh,16rem)] flex-col gap-3.5 overflow-y-auto px-3.5 py-3.5 sm:min-h-[12rem] sm:px-4"
					aria-live="polite"
					data-ai-chat-transcript
				>
					{showQuickActions ? (
						<ChatQuickActions
							pageLabel={pageLabel}
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
		</ChatDock>
	);

	return createPortal(panel, document.body);
}
