/**
 * String utility functions for text processing and decoding
 */

/**
 * Decode HTML entities in a string
 * @param value - String containing HTML entities
 * @returns Decoded string
 */
export function decodeHtmlEntities(value: string): string {
	if (typeof document === 'undefined') return value;
	
	const txt = document.createElement('textarea');
	txt.innerHTML = value;
	return txt.value;
}

/**
 * Decode MIME encoded words (RFC 2047) in email headers
 * @param value - String potentially containing MIME encoded words
 * @returns Decoded string
 */
export function decodeMimeEncodedWords(value: string): string {
	if (!value) return value;

	return value.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, _charset, encoding, text) => {
		try {
			if (encoding.toUpperCase() === 'Q') {
				text = text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_m: string, hex: string) =>
					String.fromCharCode(parseInt(hex, 16))
				);
			} else if (encoding.toUpperCase() === 'B') {
				text = atob(text);
			}
			return text;
		} catch {
			return match;
		}
	});
}

/**
 * Clean and format a snippet for display
 * @param snippet - Raw snippet text
 * @returns Cleaned and formatted snippet
 */
export function cleanSnippet(snippet: string): string {
	if (!snippet) return '';

	return snippet
		.replace(/[\r\n]+/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/^["']|["']$/g, '')
		.trim();
}

/**
 * Clean assistant response text
 * @param content - Raw response content
 * @returns Cleaned response text
 */
export function cleanAssistantResponse(content: string): string {
	let cleaned = content.trim();

	const patterns = [
		/^(Here is |Here's |I found |I can help |Let me help |Based on |According to |I'll |I will )/i,
		/^(Sure[,!]? |Certainly[,!]? |Of course[,!]? |Absolutely[,!]? )/i,
	];

	for (const pattern of patterns) {
		cleaned = cleaned.replace(pattern, '');
	}

	cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
	cleaned = cleaned.replace(/[ \t]+/g, ' ');
	cleaned = cleaned.replace(/\n /g, '\n');

	return cleaned.trim();
}

/**
 * Format a published date string
 * @param value - Date string or ISO timestamp
 * @returns Formatted date string or null
 */
export function formatPublishedDate(value?: string): string | null {
	if (!value) return null;
	
	try {
		const date = new Date(value);
		if (isNaN(date.getTime())) return null;
		
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	} catch {
		return null;
	}
}

/**
 * Generate a unique ID
 * @returns Random ID string
 */
export function createId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
