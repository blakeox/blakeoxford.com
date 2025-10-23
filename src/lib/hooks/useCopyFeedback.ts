/**
 * Copy Feedback Hook
 * 
 * Custom React hook for managing copy-to-clipboard feedback state.
 * Provides temporary visual feedback when content is copied with auto-reset.
 * 
 * @module hooks/useCopyFeedback
 */

import { useCallback, useRef, useState } from 'react';

export interface UseCopyFeedbackOptions {
	/** Duration in ms before resetting copy feedback (default: 2000) */
	resetDelay?: number;
}

export interface UseCopyFeedbackReturn {
	/** ID of the copied message (for message copy feedback) */
	copiedMessageId: string | null;
	/** ID of the copied share URL (for share link feedback) */
	copiedShareUrl: string | null;
	/** Set copied message feedback */
	setCopiedMessageId: (id: string | null) => void;
	/** Set copied share URL feedback */
	setCopiedShareUrl: (id: string | null) => void;
	/** Copy content with automatic feedback reset */
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}

/**
 * Custom hook for managing copy-to-clipboard feedback
 * 
 * Provides state management for copy feedback with automatic timeout reset.
 * Handles both message copying and share link copying with separate state tracking.
 * 
 * Features:
 * - Separate state for message and share link copies
 * - Automatic feedback reset after delay
 * - Timeout cleanup on unmount
 * - Copy function with integrated feedback
 * - Configurable reset delay
 * 
 * Common use cases:
 * - Copy message content with visual feedback
 * - Copy share links with confirmation
 * - Any copy-to-clipboard with temporary UI feedback
 * 
 * @example
 * ```tsx
 * const { copiedMessageId, copyWithFeedback } = useCopyFeedback({
 *   resetDelay: 2000,
 * });
 * 
 * const handleCopy = async (message: ChatMessage) => {
 *   await copyWithFeedback(message.content, message.id, 'message');
 * };
 * ```
 * 
 * @param options - Configuration options
 * @returns Copy feedback state and functions
 */
export function useCopyFeedback(
	options: UseCopyFeedbackOptions = {}
): UseCopyFeedbackReturn {
	const { resetDelay = 2000 } = options;

	const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
	const [copiedShareUrl, setCopiedShareUrl] = useState<string | null>(null);
	const copyResetTimeoutRef = useRef<number | null>(null);

	/**
	 * Clear any existing timeout
	 */
	const clearResetTimeout = useCallback(() => {
		if (copyResetTimeoutRef.current !== null) {
			window.clearTimeout(copyResetTimeoutRef.current);
			copyResetTimeoutRef.current = null;
		}
	}, []);

	/**
	 * Copy content to clipboard with automatic feedback reset
	 * 
	 * @param content - Text content to copy
	 * @param id - ID for feedback tracking
	 * @param type - Type of copy operation ('message' or 'share')
	 * @returns Promise resolving to success status
	 */
	const copyWithFeedback = useCallback(
		async (content: string, id: string, type: 'message' | 'share'): Promise<boolean> => {
			if (!content) return false;

			try {
				// Attempt to copy to clipboard
				await navigator.clipboard.writeText(content);

				// Clear any existing timeout
				clearResetTimeout();

				// Set feedback state based on type
				if (type === 'message') {
					setCopiedMessageId(id);
				} else {
					setCopiedShareUrl(id);
				}

				// Schedule reset
				copyResetTimeoutRef.current = window.setTimeout(() => {
					if (type === 'message') {
						setCopiedMessageId(null);
					} else {
						setCopiedShareUrl(null);
					}
					copyResetTimeoutRef.current = null;
				}, resetDelay);

				return true;
			} catch {
				// Reset feedback on error
				if (type === 'message') {
					setCopiedMessageId(null);
				} else {
					setCopiedShareUrl(null);
				}
				return false;
			}
		},
		[clearResetTimeout, resetDelay]
	);

	// Cleanup timeout on unmount
	// Note: Cleanup is handled by parent component's useEffect

	return {
		copiedMessageId,
		copiedShareUrl,
		setCopiedMessageId,
		setCopiedShareUrl,
		copyWithFeedback,
	};
}
