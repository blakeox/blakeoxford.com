import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AIChatMessage, AIChatSource } from '../../lib/ai-search';
import { AISearchError, searchWithAI } from '../../lib/ai-search';

const CONVERSATION_STORAGE_KEY = 'ai-chat:conversation';
const PREFERENCES_STORAGE_KEY = 'ai-chat:preferences';
const SEMANTIC_SEARCH_URL = '/api/semantic-search';

const GUIDED_PROMPTS = [
	{
		id: 'recent-work',
		label: 'Latest case study',
		description: 'See what shipped most recently and the impact it created.',
		icon: '🆕',
		prompt: 'What is Blake\'s latest case study and what were the key results?',
	},
	{
		id: 'skills',
		label: 'Technical stack',
		description: 'Get a quick overview of systems, frameworks, and specialties.',
		icon: '🛠️',
		prompt: 'Summarize Blake\'s core technical skills and current focus areas.',
	},
	{
		id: 'collaboration',
		label: 'Ways to collaborate',
		description: 'Explore engagement models and how to start a project together.',
		icon: '🤝',
		prompt: 'How can I collaborate with Blake on a new project?',
	},
];

interface ContextualCTA {
	condition: (query: string, sources: AIChatSource[]) => boolean;
	message: string;
	ctaText: string;
	ctaLink: string;
	icon: string;
}

const CONTEXTUAL_CTAS: ContextualCTA[] = [
	{
		condition: (query, sources) =>
			query.toLowerCase().includes('project') ||
			query.toLowerCase().includes('portfolio') ||
			sources.some((s) => s.collection === 'projects'),
		message: 'Interested in working together on a similar project?',
		ctaText: 'Schedule a consultation',
		ctaLink: '/contact?ref=autorag&topic=project-inquiry',
		icon: '📅',
	},
	{
		condition: (query) =>
			query.toLowerCase().includes('experience') ||
			query.toLowerCase().includes('skills') ||
			query.toLowerCase().includes('expertise'),
		message: 'Want to discuss how my experience fits your needs?',
		ctaText: 'Let\'s chat',
		ctaLink: '/contact?ref=autorag&topic=expertise-inquiry',
		icon: '💬',
	},
	{
		condition: (_query, sources) => sources.some((s) => s.collection === 'blog'),
		message: 'Found this helpful? Get more insights delivered to your inbox.',
		ctaText: 'Subscribe to newsletter',
		ctaLink: '#newsletter-signup',
		icon: '📧',
	},
	{
		condition: (query) =>
			query.toLowerCase().includes('hire') ||
			query.toLowerCase().includes('available') ||
			query.toLowerCase().includes('freelance'),
		message: 'I\'m currently available for new opportunities!',
		ctaText: 'View availability & rates',
		ctaLink: '/contact?ref=autorag&topic=hiring',
		icon: '✨',
	},
];

const QUICK_ACTIONS = [
	{
		icon: '🚀',
		label: 'Recent Projects',
		query: 'What are Blake\'s most recent projects?',
		category: 'portfolio',
	},
	{
		icon: '💼',
		label: 'Work Experience',
		query: 'Tell me about Blake\'s professional experience',
		category: 'experience',
	},
	{
		icon: '🛠️',
		label: 'Tech Stack',
		query: 'What technologies does Blake specialize in?',
		category: 'skills',
	},
	{
		icon: '📝',
		label: 'Latest Articles',
		query: 'What has Blake written about recently?',
		category: 'blog',
	},
	{
		icon: '🎯',
		label: 'Specializations',
		query: 'What are Blake\'s core competencies and areas of expertise?',
		category: 'expertise',
	},
	{
		icon: '📞',
		label: 'Get in Touch',
		query: 'How can I contact Blake or schedule a consultation?',
		category: 'contact',
	},
];

type ChatState = 'idle' | 'loading' | 'ready';

type LoadingPhase = 'searching' | 'analyzing' | 'crafting' | null;

type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	sources?: AIChatSource[];
	feedback?: 'positive' | 'negative';
};

type SearchFallback = {
	title: string;
	url: string;
	excerpt?: string;
	score: number;
};

type SpeechRecognitionLike = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	start: () => void;
	stop: () => void;
	abort?: () => void;
	onresult: ((event: { results: Array<{ isFinal: boolean; 0?: { transcript?: string } }> }) => void) | null;
	onerror: ((event: unknown) => void) | null;
	onend: (() => void) | null;
};

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
	id: 'welcome',
	role: 'assistant',
	content:
		'Hi! I\'m the AI search assistant. Ask me about Blake\'s work, projects, technical expertise, or case studies. I\'ll provide detailed insights with specific examples and outcomes, not just summaries.',
};

function createId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `chat-${Math.random().toString(36).slice(2)}`;
}

function decodeHtmlEntities(value: string): string {
	if (!value) return value;
	return value
		.replace(/&#(\d+);/g, (match, code) => {
			const parsed = Number.parseInt(code, 10);
			return Number.isNaN(parsed) ? match : String.fromCharCode(parsed);
		})
		.replace(/&#x([0-9A-Fa-f]+);/g, (match, code) => {
			const parsed = Number.parseInt(code, 16);
			return Number.isNaN(parsed) ? match : String.fromCharCode(parsed);
		})
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, '\u0027');
}

function decodeMimeEncodedWords(value: string): string {
	if (!value) return value;
	return value.replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, (match, charset, encoding, encodedText) => {
		try {
			const normalizedCharset = String(charset).toLowerCase();
			const encodingLabel = normalizedCharset === 'utf8' ? 'utf-8' : normalizedCharset || 'utf-8';
			const normalizedEncoding = String(encoding).toLowerCase();
			const decoder = typeof TextDecoder === 'function' ? new TextDecoder(encodingLabel) : null;

			if (normalizedEncoding === 'b') {
				if (typeof atob !== 'function') return match;
				const binary = atob(encodedText);
				if (!decoder) return binary;
				const bytes = new Uint8Array(binary.length);
				for (let index = 0; index < binary.length; index += 1) {
					bytes[index] = binary.charCodeAt(index);
				}
				return decoder.decode(bytes);
			}

			if (normalizedEncoding === 'q') {
				const cleaned = encodedText.replace(/_/g, ' ');
				const bytes: number[] = [];
				for (let index = 0; index < cleaned.length; index += 1) {
					const char = cleaned[index];
					if (char === '=' && /^[0-9A-Fa-f]{2}$/.test(cleaned.slice(index + 1, index + 3))) {
						bytes.push(Number.parseInt(cleaned.slice(index + 1, index + 3), 16));
						index += 2;
					} else {
						bytes.push(char.charCodeAt(0));
					}
				}
				if (!decoder) {
					return String.fromCharCode(...bytes);
				}
				return decoder.decode(new Uint8Array(bytes));
			}
		} catch {
			return match;
		}
		return match;
	});
}

function cleanSnippet(snippet: string): string {
	const prepared = decodeMimeEncodedWords(snippet);
	const withoutLinks = prepared
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
	const withoutMarkdown = withoutLinks
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/^---.*$/gm, ' ')
		.replace(/^[#>*+-]\s*/gm, ' ')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/__(.+?)__/g, '$1');
	const decoded = decodeHtmlEntities(withoutMarkdown)
		.replace(/\]\([^)]*\)/g, ' ')
		.replace(/Press Esc to close\.?/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!decoded) return '';
	return decoded.length > 240 ? `${decoded.slice(0, 237).trim()}…` : decoded;
}

/**
 * Enhances user queries with analytical context to guide the AI toward
 * more insightful, synthesized responses rather than simple summarization.
 */
function enhanceQuery(query: string, hasHistory: boolean): string {
	const trimmed = query.trim();
	if (!trimmed) return trimmed;
	
	// Don't enhance if query already contains analytical language
	const analyticalPatterns = /\b(analyze|compare|contrast|synthesize|evaluate|assess|implications?|impact|why|how does|what makes|difference between)\b/i;
	if (analyticalPatterns.test(trimmed)) {
		return trimmed;
	}
	
	// Detect query type and add appropriate analytical framing
	const queryLower = trimmed.toLowerCase();
	
	// Skills/experience queries - ask for insights and context
	if (queryLower.match(/\b(skill|experience|tech|stack|tool|framework|language|proficiency)\b/)) {
		return `${trimmed} Please provide specific examples and explain how these skills have been applied to solve real business problems.`;
	}
	
	// Project queries - ask for outcomes and learnings
	if (queryLower.match(/\b(project|case study|work|portfolio|built|created|developed)\b/)) {
		return `${trimmed} Focus on measurable outcomes, challenges overcome, and key insights gained.`;
	}
	
	// Comparison queries - explicitly request analysis
	if (queryLower.match(/\b(latest|recent|newest|current|now)\b/) && !hasHistory) {
		return `${trimmed} Compare this to previous work and highlight what makes it unique or improved.`;
	}
	
	// General "what" questions - ask for deeper insights
	if (queryLower.startsWith('what is') || queryLower.startsWith('what are') || queryLower.startsWith('what does')) {
		return `${trimmed} Provide context on why this matters and how it creates value.`;
	}
	
	// "How" questions - request methodology and reasoning
	if (queryLower.startsWith('how')) {
		return `${trimmed} Include the reasoning behind the approach and lessons learned.`;
	}
	
	// For follow-up questions in conversation, be less aggressive
	if (hasHistory) {
		return trimmed;
	}
	
	// Default enhancement for first message: request comprehensive analysis
	return `${trimmed} Please provide a comprehensive answer with specific examples, outcomes, and insights rather than just a summary.`;
}

function cleanAssistantResponse(content: string): string {
	if (!content) return content;
	
	// Remove YAML frontmatter blocks (--- at start and end)
	let cleaned = content.replace(/^---\s*[\s\S]*?---\s*/gm, '');
	
	// Remove standalone dividers (---, ***, ___)
	cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');
	
	// Remove markdown file path indicators like "File: src/..." or similar patterns
	cleaned = cleaned.replace(/^File:\s+.*$/gm, '');
	cleaned = cleaned.replace(/^Path:\s+.*$/gm, '');
	
	// Remove markdown code fence artifacts that might appear
	cleaned = cleaned.replace(/^```[\w]*\s*$/gm, '');
	
	// Remove markdown headings (# ## ### etc.)
	cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
	
	// Remove blockquote markers
	cleaned = cleaned.replace(/^>\s*/gm, '');
	
	// Convert markdown unordered list items to plain text with bullet points
	cleaned = cleaned.replace(/^\s*[*\-+]\s+/gm, '• ');
	
	// Convert markdown ordered list items to plain text
	cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, (match) => {
		const num = match.match(/\d+/)?.[0] || '1';
		return `${num}. `;
	});
	
	// Remove markdown strikethrough
	cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
	
	// Remove markdown bold/italic formatting
	cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
	cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
	cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
	cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
	
	// Remove markdown links but keep the text
	cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
	
	// Remove markdown inline code backticks
	cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
	
	// Remove HTML tags (basic sanitization)
	cleaned = cleaned.replace(/<[^>]+>/g, '');
	
	// Decode common HTML entities
	cleaned = cleaned.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&#39;/g, '\'')
		.replace(/&apos;/g, '\'');
	
	// Remove escaped markdown characters
	cleaned = cleaned.replace(/\\([*_[\](){}#+.!`|-])/g, '$1');
	
	// Clean up excessive whitespace while preserving paragraph breaks
	cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
	
	// Clean up spaces around bullet points for consistency
	cleaned = cleaned.replace(/^•\s+/gm, '• ');
	
	return cleaned.trim();
}

function formatPublishedDate(value?: string): string | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AIChatIsland() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
	const [inputValue, setInputValue] = useState('');
	const [chatState, setChatState] = useState<ChatState>('idle');
	const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
	const [error, setError] = useState<string | null>(null);
	const [touchStartY, setTouchStartY] = useState<number | null>(null);
	const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
	const [useMemory, setUseMemory] = useState<boolean>(() => {
		if (typeof window === 'undefined') return true;
		try {
			const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
			if (!stored) return true;
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed.useMemory === 'boolean') {
				return parsed.useMemory;
			}
		} catch {
			/* ignore preference parse errors */
		}
		return true;
	});
	const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
	const [copiedShareUrl, setCopiedShareUrl] = useState<string | null>(null);
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
	const [showDigest, setShowDigest] = useState(false);
	const [showAnalytics, setShowAnalytics] = useState(false);
	const [showAdvancedControls, setShowAdvancedControls] = useState(false);
	const [voiceSupported, setVoiceSupported] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [interimTranscript, setInterimTranscript] = useState('');
	const [fallbackResults, setFallbackResults] = useState<SearchFallback[]>([]);
	const [showFallbackSuggestions, setShowFallbackSuggestions] = useState(false);
	const [composerFocused, setComposerFocused] = useState(false);
	const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
	const [showScrollToLatest, setShowScrollToLatest] = useState(false);
	const siteHostname = useMemo(() => {
		if (typeof window !== 'undefined') {
			return window.location.hostname;
		}
		return 'blakeoxford.com';
	}, []);

	const panelRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const launcherRef = useRef<HTMLButtonElement | null>(null);
	const lastFocusedElement = useRef<HTMLElement | null>(null);
	const copyResetTimeoutRef = useRef<number | null>(null);
	const conversationHydratedRef = useRef(false);
	const lastQueryRef = useRef<string | null>(null);
	const messagesRef = useRef(messages);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
	const activeRequestRef = useRef<AbortController | null>(null);
	const sourceRefs = useRef<HTMLAnchorElement[]>([]);

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	useEffect(() => {
		setShowFallbackSuggestions(false);
	}, [fallbackResults]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const stored = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored);
			if (!Array.isArray(parsed) || parsed.length === 0) return;
			const restored: ChatMessage[] = parsed
				.filter(
					(item) =>
						item &&
						typeof item === 'object' &&
						(item.role === 'user' || item.role === 'assistant') &&
						typeof item.id === 'string' &&
						typeof item.content === 'string',
				)
				.slice(-30)
				.map((item) => {
					const sources = Array.isArray(item.sources)
						? (item.sources
								.filter(
									(source: unknown) =>
										source &&
										typeof source === 'object' &&
										typeof (source as { title?: unknown }).title === 'string' &&
										typeof (source as { url?: unknown }).url === 'string',
								)
								.slice(0, 5) as AIChatSource[])
						: undefined;
					const feedback = item.feedback === 'positive' || item.feedback === 'negative' ? item.feedback : undefined;
					return {
						id: item.id,
						role: item.role,
						content: item.content,
						sources,
						feedback,
					} as ChatMessage;
				});
			if (restored.length > 0) {
				setMessages(restored);
			}
		} catch {
			/* ignore restore issues */
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!conversationHydratedRef.current) {
			conversationHydratedRef.current = true;
			return;
		}
		try {
			window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages));
		} catch {
			/* ignore persistence issues */
		}
	}, [messages]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ useMemory }));
		} catch {
			/* ignore preference persistence failures */
		}
	}, [useMemory]);

	useEffect(() => {
		return () => {
			if (copyResetTimeoutRef.current !== null) {
				window.clearTimeout(copyResetTimeoutRef.current);
			}
			if (activeRequestRef.current) {
				activeRequestRef.current.abort();
				activeRequestRef.current = null;
			}
			if (recognitionRef.current) {
				try {
					recognitionRef.current.stop();
				} catch {
					/* ignore stop failures */
				}
				recognitionRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const globalWindow = window as typeof window & {
			SpeechRecognition?: new () => SpeechRecognitionLike;
			webkitSpeechRecognition?: new () => SpeechRecognitionLike;
		};
		const RecognitionCtor = globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;
		if (!RecognitionCtor) return;
		const recognition = new RecognitionCtor();
		recognition.lang = 'en-US';
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.maxAlternatives = 1;
		recognition.onresult = (event) => {
			let finalTranscript = '';
			let interim = '';
			for (let i = 0; i < event.results.length; i += 1) {
				const result = event.results[i];
				const transcript = result?.[0]?.transcript ?? '';
				if (!transcript) continue;
				if (result.isFinal) {
					finalTranscript += transcript;
				} else {
					interim += transcript;
				}
			}
			if (finalTranscript.trim()) {
				setInputValue((prev) => {
					const existing = prev.trim();
					const combined = existing ? `${existing} ${finalTranscript.trim()}` : finalTranscript.trim();
					return combined.trim();
				});
			}
			setInterimTranscript(interim.trim());
		};
		recognition.onerror = () => {
			setIsListening(false);
			setInterimTranscript('');
		};
		recognition.onend = () => {
			setIsListening(false);
			setInterimTranscript('');
		};
		recognitionRef.current = recognition;
		setVoiceSupported(true);

		return () => {
			recognition.onresult = null;
			recognition.onerror = null;
			recognition.onend = null;
			try {
				recognition.stop();
			} catch {
				/* ignore stop failures */
			}
			recognitionRef.current = null;
		};
	}, []);

	const dispatchState = useCallback((open: boolean) => {
		if (typeof window === 'undefined') return;
		window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open } }));
	}, []);

	const focusInput = useCallback(() => {
		if (!inputRef.current) return;
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
		});
	}, []);

	const openChat = useCallback(() => {
		if (isOpen) {
			focusInput();
			return;
		}
		lastFocusedElement.current = (document.activeElement as HTMLElement | null) ?? null;
		setIsOpen(true);
		setError(null);
		setChatState((state) => (state === 'idle' ? 'ready' : state));
	}, [focusInput, isOpen]);

	const closeChat = useCallback(() => {
		if (!isOpen) return;
		if (isListening && recognitionRef.current) {
			try {
				recognitionRef.current.stop();
			} catch {
				/* ignore stop failures */
			}
			setIsListening(false);
			setInterimTranscript('');
		}
		setIsOpen(false);
		setError(null);
		setTouchStartY(null);
		setTouchCurrentY(null);
		if (lastFocusedElement.current && typeof lastFocusedElement.current.focus === 'function') {
			requestAnimationFrame(() => {
				lastFocusedElement.current?.focus();
			});
		}
	}, [isListening, isOpen]);

	const handleTouchStart = useCallback((event: React.TouchEvent) => {
		if (event.touches.length === 1) {
			setTouchStartY(event.touches[0].clientY);
		}
	}, []);

	const handleTouchMove = useCallback((event: React.TouchEvent) => {
		if (touchStartY !== null && event.touches.length === 1) {
			setTouchCurrentY(event.touches[0].clientY);
		}
	}, [touchStartY]);

	const handleTouchEnd = useCallback(() => {
		if (touchStartY !== null && touchCurrentY !== null) {
			const deltaY = touchCurrentY - touchStartY;
			// Swipe down more than 100px to close
			if (deltaY > 100) {
				closeChat();
			}
		}
		setTouchStartY(null);
		setTouchCurrentY(null);
	}, [touchStartY, touchCurrentY, closeChat]);

	const buildHistoryForRequest = useCallback((): AIChatMessage[] => {
		if (!useMemory) return [];
		return messagesRef.current
			.filter((message) => message.role === 'user' || message.role === 'assistant')
			.slice(-10)
			.map((message) => ({ role: message.role, content: message.content }));
	}, [useMemory]);

	const updateFallbackSuggestions = useCallback(
		async (query: string) => {
			const normalized = query.toLowerCase().trim();
			if (!normalized) {
				setFallbackResults([]);
				return;
			}
			
			// Use Vectorize semantic search instead of keyword matching
			try {
				const response = await fetch(SEMANTIC_SEARCH_URL, {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					},
					body: JSON.stringify({ query: normalized })
				});
				
				if (!response.ok) {
					setFallbackResults([]);
					return;
				}
				
				const data = await response.json();
				
				// Transform Vectorize results to SearchFallback format
				if (data.results && Array.isArray(data.results)) {
					const ranked = data.results
						.slice(0, 3)
						.map((result: any) => ({
							title: result.title || result.id,
							url: result.url || `/${result.id}`,
							excerpt: result.description || '',
							score: result.score || 0
						}));
					setFallbackResults(ranked);
				} else {
					setFallbackResults([]);
				}
			} catch (err) {
				console.error('Semantic search failed:', err);
				setFallbackResults([]);
			}
		},
		[],
	);

	const appendAssistantChunk = useCallback((messageId: string, chunk: string) => {
		if (!chunk) return;
		setMessages((prev) =>
			prev.map((message) =>
				message.id === messageId
					? {
							...message,
							content: `${message.content}${chunk}`,
						}
					: message,
			),
		);
	}, []);

	const replaceAssistantContent = useCallback((messageId: string, content: string) => {
		setMessages((prev) =>
			prev.map((message) =>
				message.id === messageId
					? {
							...message,
							content,
						}
					: message,
			),
		);
	}, []);

	const assignAssistantSources = useCallback((messageId: string, sources: AIChatSource[]) => {
		setMessages((prev) =>
			prev.map((message) =>
				message.id === messageId
					? {
							...message,
							sources,
						}
					: message,
			),
		);
	}, []);

	const clearConversation = useCallback(() => {
		if (copyResetTimeoutRef.current !== null) {
			window.clearTimeout(copyResetTimeoutRef.current);
		}
		setCopiedMessageId(null);
		setMessages([INITIAL_ASSISTANT_MESSAGE]);
		setError(null);
		setStreamingMessageId(null);
		setFallbackResults([]);
		setShowDigest(false);
		setShowAnalytics(false);
		setShowFallbackSuggestions(false);
		setExpandedSources({});
		setComposerFocused(false);
		setInputValue('');
		setInterimTranscript('');
		setShowScrollToLatest(false);
		lastQueryRef.current = null;
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
			} catch {
				/* ignore clear failures */
			}
		}
		requestAnimationFrame(() => {
			focusInput();
		});
	}, [focusInput]);

	const startNewChat = useCallback(() => {
		clearConversation();
	}, [clearConversation]);

	const toggleMemory = useCallback(() => {
		setUseMemory((prev) => !prev);
	}, []);

	const toggleDigest = useCallback(() => {
		setShowDigest((prev) => !prev);
	}, []);

	const toggleAnalytics = useCallback(() => {
		setShowAnalytics((prev) => !prev);
	}, []);

	const toggleAdvancedControls = useCallback(() => {
		setShowAdvancedControls((prev) => !prev);
	}, []);

	const toggleExpandedSourcesForMessage = useCallback((messageId: string) => {
		setExpandedSources((previous) => ({
			...previous,
			[messageId]: !previous[messageId],
		}));
	}, []);

	const handleCopyMessage = useCallback(async (message: ChatMessage) => {
		if (!message.content) return;
		try {
			if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
				await navigator.clipboard.writeText(message.content);
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = message.content;
				textarea.setAttribute('readonly', 'true');
				textarea.style.position = 'absolute';
				textarea.style.left = '-9999px';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
			}
			setCopiedMessageId(message.id);
			if (copyResetTimeoutRef.current !== null) {
				window.clearTimeout(copyResetTimeoutRef.current);
			}
			copyResetTimeoutRef.current = window.setTimeout(() => setCopiedMessageId(null), 2000);
		} catch {
			setCopiedMessageId(null);
		}
	}, []);

	const handleOpenPrimarySource = useCallback((url: string) => {
		if (!url) return;
		if (typeof window !== 'undefined') {
			window.location.assign(url);
		}
	}, []);

	const handleFeedback = useCallback(
		async (messageId: string, sentiment: 'positive' | 'negative') => {
			let resolvedSentiment: 'positive' | 'negative' | undefined;
			setMessages((prev) =>
				prev.map((message) => {
					if (message.id !== messageId) return message;
					const nextSentiment = message.feedback === sentiment ? undefined : sentiment;
					resolvedSentiment = nextSentiment;
					return { ...message, feedback: nextSentiment };
				}),
			);
			if (!resolvedSentiment) return;
			try {
				await fetch('/api/ai-feedback', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						messageId,
						sentiment: resolvedSentiment,
						query: lastQueryRef.current,
						metadata: {
							conversationLength: messagesRef.current.length,
						},
					}),
					keepalive: true,
				});
			} catch {
				/* ignore feedback errors */
			}
		},
		[],
	);

	const handleExportConversation = useCallback(() => {
		if (messages.length === 0) return;
		
		// Generate Markdown content
		const timestamp = new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		
		let markdown = '# AI Conversation with Blake Oxford\n\n';
		markdown += `**Exported**: ${timestamp}  \n`;
		markdown += `**Messages**: ${messages.length}  \n`;
		markdown += `**URL**: ${window.location.href}\n\n`;
		markdown += '---\n\n';
		
		messages.forEach((message, index) => {
			const role = message.role === 'user' ? '👤 You' : '🤖 AI Assistant';
			markdown += `## ${role}\n\n`;
			markdown += `${message.content}\n\n`;
			
			// Add sources for assistant messages
			if (message.role === 'assistant' && message.sources && message.sources.length > 0) {
				markdown += '### 📚 Sources\n\n';
				message.sources.forEach((source, sourceIndex) => {
					const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || source.url));
					const score = source.score ? ` (${Math.round(source.score * 100)}% relevant)` : '';
					const collection = source.collection ? ` [${source.collection}]` : '';
					markdown += `${sourceIndex + 1}. [${title}](${source.url})${score}${collection}\n`;
					if (source.snippet) {
						markdown += `   > ${source.snippet}\n\n`;
					}
				});
				markdown += '\n';
			}
			
			if (index < messages.length - 1) {
				markdown += '---\n\n';
			}
		});
		
		markdown += '\n---\n\n';
		markdown += `*Conversation exported from [blakeoxford.com](${window.location.origin})*\n`;
		
		// Create and download file
		const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const filename = `ai-conversation-${Date.now()}.md`;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		
		// Track export
		if ((window as any).plausible) {
			(window as any).plausible('AutoRAG Export', {
				props: { format: 'markdown', messages: messages.length },
			});
		}
	}, [messages]);

	const toggleVoiceInput = useCallback(() => {
		if (!voiceSupported) return;
		const recognition = recognitionRef.current;
		if (!recognition) return;
		openChat();
		if (isListening) {
			try {
				recognition.stop();
			} catch {
				/* ignore stop failures */
			}
			setIsListening(false);
			setInterimTranscript('');
			return;
		}
		try {
			setInterimTranscript('');
			recognition.start();
			setIsListening(true);
		} catch {
			setIsListening(false);
		}
	}, [isListening, openChat, voiceSupported]);

	const handleTextareaKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			const trimmed = event.currentTarget.value.trim();
			if (!trimmed || chatState === 'loading') {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		},
		[chatState],
	);

	const sendQuery = useCallback(
		async (query: string) => {
			setChatState('loading');
			setLoadingPhase('searching');
			setError(null);
			setFallbackResults([]);
			lastQueryRef.current = query;

			const userMessage: ChatMessage = { id: createId(), role: 'user', content: query };
			const assistantId = createId();

			setMessages((prev) => [
				...prev,
				userMessage,
				{ id: assistantId, role: 'assistant', content: '', sources: [] },
			]);
			setStreamingMessageId(assistantId);

			const controller = new AbortController();
			if (activeRequestRef.current) {
				activeRequestRef.current.abort();
			}
			activeRequestRef.current = controller;

			const historyPayload = buildHistoryForRequest();
			
			// Enhance the query with analytical context to guide better responses
			const enhancedQuery = useMemory 
				? enhanceQuery(query, historyPayload.length > 0)
				: query;

			// Progressive loading phases for user feedback
			const searchingTimer = setTimeout(() => setLoadingPhase('analyzing'), 1500);
			const analyzingTimer = setTimeout(() => setLoadingPhase('crafting'), 4000);

			try {
				await searchWithAI(enhancedQuery, {
					history: historyPayload,
					signal: controller.signal,
					onToken: (token) => {
						appendAssistantChunk(assistantId, token);
						if (scrollContainerRef.current) {
							scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight });
						}
					},
					onSources: (sources) => {
						assignAssistantSources(assistantId, sources);
						setLoadingPhase('crafting');
					},
					onCompletion: (message) => {
						replaceAssistantContent(assistantId, message.trim());
					},
				});
				clearTimeout(searchingTimer);
				clearTimeout(analyzingTimer);
				setStreamingMessageId(null);
				setLoadingPhase(null);
				setChatState('ready');
				await updateFallbackSuggestions(query);
			} catch (err) {
				clearTimeout(searchingTimer);
				clearTimeout(analyzingTimer);
				if (controller.signal.aborted) {
					setLoadingPhase(null);
					return;
				}
				setStreamingMessageId(null);
				setLoadingPhase(null);
				setChatState('ready');
				setMessages((prev) => prev.filter((message) => message.id !== assistantId));
				
				// Enhanced error messages with actionable guidance
				let message = 'Unable to reach the AI assistant right now. Please try again.';
				if (err instanceof AISearchError) {
					message = err.message;
					// Categorize known error patterns
					if (err.message.includes('timeout') || err.message.includes('timed out')) {
						message = 'Request timed out. Try simplifying your question or check your connection.';
					} else if (err.message.includes('rate limit') || err.message.includes('too many')) {
						message = 'Too many requests. Please wait a moment and try again.';
					} else if (err.message.includes('network') || err.message.includes('fetch')) {
						message = 'Network error. Check your internet connection and try again.';
					}
				}
				setError(message);
				await updateFallbackSuggestions(query);
			} finally {
				activeRequestRef.current = null;
			}
		},
		[appendAssistantChunk, assignAssistantSources, buildHistoryForRequest, replaceAssistantContent, updateFallbackSuggestions, useMemory],
	);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const query = inputValue.trim();
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, inputValue, sendQuery],
	);

	const handleReplayQuery = useCallback(
		async (query: string) => {
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, sendQuery],
	);

	const handleGuidedPrompt = useCallback(
		(prompt: string) => {
			setInputValue(prompt);
			openChat();
			focusInput();
		},
		[focusInput, openChat],
	);

	const scrollToLatest = useCallback(() => {
		if (!scrollContainerRef.current) return;
		scrollContainerRef.current.scrollTo({
			top: scrollContainerRef.current.scrollHeight,
			behavior: 'smooth',
		});
		setShowScrollToLatest(false);
	}, []);

	const retryLastQuery = useCallback(async () => {
		if (!lastQueryRef.current || chatState === 'loading') return;
		await sendQuery(lastQueryRef.current);
	}, [chatState, sendQuery]);

	useEffect(() => {
		if (!isOpen) return;
		focusInput();
	}, [focusInput, isOpen]);

	useEffect(() => {
		if (!launcherRef.current) return;
		launcherRef.current.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
	}, [isOpen]);

	useEffect(() => {
		dispatchState(isOpen);
	}, [dispatchState, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeChat();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [closeChat, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!panelRef.current || !target) return;
			if (!panelRef.current.contains(target)) {
				closeChat();
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [closeChat, isOpen]);

	useEffect(() => {
		if (!isOpen || !panelRef.current) return;
		const panel = panelRef.current;
		const handleKey = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
				return;
			}
			const focusable = sourceRefs.current.filter((element) => element && element.isConnected);
			if (focusable.length === 0) return;
			const active = document.activeElement;
			const currentIndex = focusable.findIndex((element) => element === active);
			let nextIndex = currentIndex;
			if (event.key === 'ArrowDown') {
				nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusable.length : 0;
			} else if (currentIndex <= 0) {
				nextIndex = focusable.length - 1;
			} else {
				nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
			}
			focusable[nextIndex]?.focus();
			event.preventDefault();
		};
		panel.addEventListener('keydown', handleKey);
		return () => panel.removeEventListener('keydown', handleKey);
	}, [isOpen]);

	useEffect(() => {
		const handleOpen = () => openChat();
		const handleToggle = () => {
			if (isOpen) {
				closeChat();
			} else {
				openChat();
			}
		};
		window.addEventListener('ai-chat:open', handleOpen as EventListener);
		window.addEventListener('ai-chat:toggle', handleToggle as EventListener);
		const handleShortcut = (event: KeyboardEvent) => {
			const isMac = navigator.platform.toLowerCase().includes('mac');
			const metaPressed = isMac ? event.metaKey : event.ctrlKey;
			const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
			if ((metaPressed && event.key.toLowerCase() === 'k') || isSlash) {
				event.preventDefault();
				openChat();
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => {
			window.removeEventListener('ai-chat:open', handleOpen as EventListener);
			window.removeEventListener('ai-chat:toggle', handleToggle as EventListener);
			window.removeEventListener('keydown', handleShortcut);
		};
	}, [closeChat, isOpen, openChat]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		if (showScrollToLatest) return;
		container.scrollTo({ top: container.scrollHeight });
	}, [messages, showScrollToLatest]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const updateVisibility = () => {
			const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
			setShowScrollToLatest(distance > 48);
		};
		updateVisibility();
		container.addEventListener('scroll', updateVisibility);
		return () => {
			container.removeEventListener('scroll', updateVisibility);
		};
	}, [isOpen, messages]);

	const recentQueries = useMemo(() => {
		return messages
			.filter((message) => message.role === 'user')
			.map((message) => message.content.trim())
			.filter((value) => value.length > 0)
			.slice(-3)
			.reverse();
	}, [messages]);

	const conversationDigest = useMemo(() => {
		const assistantMessages = messages.filter(
			(message) => message.role === 'assistant' && message.id !== INITIAL_ASSISTANT_MESSAGE.id,
		);
		if (assistantMessages.length === 0) return [] as string[];
		return assistantMessages
			.slice(-3)
			.map((message) => {
				const segment = message.content.split(/(?<=[.!?])\s+/u)[0]?.trim() ?? '';
				if (!segment) return '';
				return segment.length > 140 ? `${segment.slice(0, 137).trim()}…` : segment;
			})
			.filter((value) => value.length > 0);
	}, [messages]);

	const feedbackAnalytics = useMemo(() => {
		const assistantMessages = messages.filter(
			(message) => message.role === 'assistant' && message.id !== INITIAL_ASSISTANT_MESSAGE.id,
		);
		const totalAssistant = assistantMessages.length;
		const positive = assistantMessages.filter((message) => message.feedback === 'positive').length;
		const negative = assistantMessages.filter((message) => message.feedback === 'negative').length;
		const cited = new Map<
			string,
			{
				url: string;
				title: string;
				count: number;
			}
		>();
		assistantMessages.forEach((message) => {
			message.sources?.forEach((source) => {
				if (!source.url) return;
				const existing = cited.get(source.url) ?? {
					url: source.url,
					title: decodeHtmlEntities(source.title || source.url),
					count: 0,
				};
				existing.count += 1;
				cited.set(source.url, existing);
			});
		});
		const topSources = Array.from(cited.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 3);
		return {
			totalAssistant,
			positive,
			negative,
			positiveRate: totalAssistant > 0 ? Math.round((positive / totalAssistant) * 100) : null,
			topSources,
		};
	}, [messages]);

	const guidedPromptVisible = useMemo(() => messages.filter((message) => message.role === 'user').length === 0, [messages]);

	sourceRefs.current = [];
	const lastQueryValue = lastQueryRef.current;
	const canRetry = Boolean(lastQueryValue) && chatState !== 'loading';
	const fallbackPreviewLimit = 2;
	const visibleFallbackResults = showFallbackSuggestions ? fallbackResults : fallbackResults.slice(0, fallbackPreviewLimit);
	const hasMoreFallbackResults = fallbackResults.length > visibleFallbackResults.length;
	const composerHasValue = inputValue.trim().length > 0 || interimTranscript.length > 0;
	const floatingLabelActive = composerFocused || composerHasValue;
	const canStartNewChat = messages.length > 1;

	return (
		<div
			className="ai-chat-wrapper pointer-events-none fixed bottom-4 right-4 z-[1050] flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6"
			data-ai-chat-open={isOpen ? 'true' : 'false'}
		>
			<button
				ref={launcherRef}
				type="button"
				className="ai-chat-launcher pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border border-[color:var(--border)]/60 bg-[color:var(--glass-surface-bg)]/95 text-[color:var(--fg)] shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
				aria-label={isOpen ? 'Close AI search assistant' : 'Open AI search assistant'}
				onClick={() => {
					if (isOpen) {
						closeChat();
					} else {
						openChat();
					}
				}}
			>
				<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
					{isOpen ? (
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					) : (
						<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
					)}
				</svg>
			</button>

			<div
				ref={panelRef}
				className={`ai-chat-panel pointer-events-auto w-[min(95vw,24rem)] overflow-hidden rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/80 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.65)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/80 transition-transform duration-200 ease-out sm:w-[min(85vw,28rem)] ${
					isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
				}`}
				style={{
					transform: touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY
						? `translateY(${Math.min(touchCurrentY - touchStartY, 200)}px)`
						: isOpen ? 'translateY(0)' : 'translateY(1rem)',
					opacity: touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY
						? Math.max(0.5, 1 - (touchCurrentY - touchStartY) / 400)
						: isOpen ? 1 : 0
				}}
				data-ai-chat-panel
				data-ai-visible={isOpen ? 'true' : 'false'}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ai-chat-heading"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/40 px-4 py-3">
					<div className="flex flex-col">
						<span id="ai-chat-heading" className="text-sm font-semibold text-[color:var(--fg)]">
							AI Portfolio Assistant
						</span>
						<span className="text-xs text-[color:var(--fg)]/60">Powered by AutoRAG search</span>
					</div>
					<div className="flex items-center gap-2">
						{voiceSupported && (
							<button
								type="button"
								className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
									isListening ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
								}`}
								aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
								onClick={toggleVoiceInput}
							>
								<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-4 0h8" />
								</svg>
							</button>
						)}
						<button
							type="button"
							className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
							showAdvancedControls ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
						}`}
							aria-label={showAdvancedControls ? 'Hide advanced controls' : 'Show advanced controls'}
							onClick={toggleAdvancedControls}
						>
							<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v1.5m0 9V18m6-6h-1.5m-9 0H6m8.485-4.485-1.06 1.06m-6.85 6.85-1.06 1.06m0-8.97 1.06 1.06m6.85 6.85 1.06 1.06M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
							</svg>
						</button>
						<button
							type="button"
							className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95"
							aria-label="Close assistant"
							onClick={closeChat}
						>
							<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div
					className={`border-b border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/35 px-4 py-0 text-xs text-[color:var(--fg)]/70 transition-[max-height,opacity,padding] duration-300 ease-out ${
						showAdvancedControls ? 'max-h-[24rem] py-3 opacity-100' : 'max-h-0 opacity-0'
					}`}
				>
					<div
						className={`${showAdvancedControls ? 'pointer-events-auto' : 'pointer-events-none'} grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}
					>
						<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-2">
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									useMemory ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={useMemory ? 'Disable conversation memory' : 'Enable conversation memory'}
								onClick={toggleMemory}
							>
								{useMemory ? 'Memory on' : 'Memory off'}
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									showDigest ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={showDigest ? 'Hide conversation digest' : 'Show conversation digest'}
								onClick={toggleDigest}
							>
								Digest
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									showAnalytics ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={showAnalytics ? 'Hide insights' : 'Show insights'}
								onClick={toggleAnalytics}
							>
								Insights
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45"
								onClick={clearConversation}
							>
								Clear
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleExportConversation}
								disabled={messages.length === 0}
								title="Download conversation as Markdown"
							>
								<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
								Export
							</button>
						</div>
						{feedbackAnalytics.totalAssistant > 0 && (
							<div className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/60 px-3 py-2">
								<span className="text-[0.65rem] uppercase tracking-wide text-[color:var(--fg)]/45">Session insights</span>
								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Replies</span>
										<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.totalAssistant}</span>
									</div>
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Helpful</span>
										<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
									</div>
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Needs work</span>
										<span className="text-sm font-semibold text-red-500 dark:text-red-300">{feedbackAnalytics.negative}</span>
									</div>
									{feedbackAnalytics.positiveRate !== null && (
										<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
											<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Positive rate</span>
											<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{guidedPromptVisible && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-[0.75rem] text-[color:var(--fg)]/70">
						<div className="flex flex-col gap-0.5">
							<span className="uppercase tracking-wide text-[0.7rem] text-[color:var(--fg)]/45">Jump in</span>
							<span className="text-[color:var(--fg)]/60">Choose a suggested prompt to get a rich, sourced answer.</span>
						</div>
						<div className="mt-3 grid gap-2 sm:grid-cols-2">
							{GUIDED_PROMPTS.map((prompt) => (
								<button
									key={prompt.id}
									type="button"
									className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-3 text-left transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
									onClick={() => handleGuidedPrompt(prompt.prompt)}
									title={prompt.prompt}
								>
									<span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-base">
										{prompt.icon}
									</span>
									<span className="text-sm font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--accent-strong)]">{prompt.label}</span>
									<span className="text-[0.7rem] text-[color:var(--fg)]/65">{prompt.description}</span>
								</button>
							))}
						</div>
					</div>
				)}

				{recentQueries.length > 0 && (
					<div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-2 text-[0.65rem] text-[color:var(--fg)]/60">
						<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Recent</span>
						{recentQueries.map((query, index) => (
							<button
								key={`recent-query-${index}`}
								type="button"
								className="max-w-[14rem] truncate rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
								onClick={() => handleReplayQuery(query)}
								title={query}
							>
								{query}
							</button>
						))}
					</div>
				)}

				{showDigest && conversationDigest.length > 0 && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
						<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Conversation digest</span>
						<ul className="mt-2 list-disc space-y-1 pl-4">
							{conversationDigest.map((item, index) => (
								<li key={`digest-${index}`}>{item}</li>
							))}
						</ul>
					</div>
				)}

				{showAnalytics && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
						<div className="flex flex-wrap items-center gap-3">
							<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
								<span className="block text-[color:var(--fg)]/45">Assistant replies</span>
								<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.totalAssistant}</span>
							</div>
							<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
								<span className="block text-[color:var(--fg)]/45">Helpful</span>
								<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
							</div>
							<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
								<span className="block text-[color:var(--fg)]/45">Needs work</span>
								<span className="text-sm font-semibold text-red-500 dark:text-red-300">{feedbackAnalytics.negative}</span>
							</div>
							{feedbackAnalytics.positiveRate !== null && (
								<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
									<span className="block text-[color:var(--fg)]/45">Positive rate</span>
									<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
								</div>
							)}
						</div>
						{feedbackAnalytics.topSources.length > 0 && (
							<div className="mt-3">
								<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Frequently cited</span>
								<ul className="mt-2 space-y-1">
									{feedbackAnalytics.topSources.map((source, index) => (
										<li key={`top-source-${index}`} className="flex items-center justify-between gap-2 text-[color:var(--fg)]/70">
											<a href={source.url} className="truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2" target="_blank" rel="noreferrer">
												{source.title}
											</a>
											<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 text-[0.65rem] font-medium text-[color:var(--accent-strong)]">
												{source.count}×
											</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				<div className="relative">
					<div
						ref={scrollContainerRef}
						className="flex max-h-80 flex-col gap-4 overflow-y-auto px-4 py-4"
						aria-live="polite"
						data-ai-chat-transcript
					>
						{messages.length === 0 && chatState === 'ready' && (
							<div className="space-y-4">
								<div className="text-center space-y-2">
									<h3 className="text-lg font-semibold text-[color:var(--fg)]">
										👋 How can I help you today?
									</h3>
									<p className="text-sm text-[color:var(--fg)]/60">
										Try one of these popular questions:
									</p>
								</div>
								
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{QUICK_ACTIONS.map((action, index) => (
										<button
											key={index}
											type="button"
											onClick={() => {
												setInputValue(action.query);
												// Auto-submit after a brief delay for UX smoothness
												setTimeout(() => sendQuery(action.query), 100);
												
												// Track quick action usage
												if ((window as any).plausible) {
													(window as any).plausible('AutoRAG Quick Action', {
														props: { category: action.category, label: action.label },
													});
												}
											}}
											className="group flex items-start gap-3 rounded-xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 p-4 text-left transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
										>
											<span className="flex-shrink-0 text-2xl transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
												{action.icon}
											</span>
											<div className="min-w-0 flex-1">
												<div className="mb-1 text-sm font-medium text-[color:var(--fg)]">
													{action.label}
												</div>
												<div className="line-clamp-2 text-xs text-[color:var(--fg)]/60">
													{action.query}
												</div>
											</div>
											<svg 
												className="size-5 flex-shrink-0 text-[color:var(--fg)]/40 transition-colors group-hover:text-[color:var(--accent)]" 
												fill="none" 
												stroke="currentColor" 
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									))}
								</div>
							</div>
						)}
						{messages.map((message) => {
						const alignment = message.role === 'user' ? 'items-end text-right' : 'items-start text-left';
						const bubbleClasses = message.role === 'user'
							? 'bg-[color:var(--accent)] text-[color:var(--on-accent)]'
							: 'bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90';
						const isAssistant = message.role === 'assistant';
						const isStreaming = streamingMessageId === message.id;
						const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
						const sources = isAssistant && message.sources ? message.sources : [];
						const totalSources = sources.length;
						const showAllSources = isAssistant ? Boolean(expandedSources[message.id]) : false;
						const primarySource = sources[0] ?? null;
						const primarySourceTitle = primarySource ? decodeMimeEncodedWords(decodeHtmlEntities(primarySource.title || primarySource.url)) : null;
						let primarySourceIsExternal = false;
						if (primarySource) {
							try {
								const parsed = primarySource.url.startsWith('http')
									? new URL(primarySource.url)
									: new URL(primarySource.url, `https://${siteHostname}`);
								primarySourceIsExternal = parsed.hostname !== siteHostname;
							} catch {
								primarySourceIsExternal = !primarySource.url.startsWith('/');
							}
						}
						const primaryLinkTarget = primarySourceIsExternal ? '_blank' : undefined;
						const primaryLinkRel = primarySourceIsExternal ? 'noreferrer' : undefined;
						const isHelpful = message.feedback === 'positive';
						const isNotHelpful = message.feedback === 'negative';
						const messageTextClasses = isAssistant ? 'text-[0.95rem] leading-relaxed' : 'text-[0.9rem] leading-snug';

						return (
							<div key={message.id} className={`flex flex-col gap-2 ${alignment}`} data-ai-message-role={message.role}>
								<div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-[color:var(--border)]/20 dark:ring-[color:var(--border)]/30 ${bubbleClasses}`}>
									<div className="flex flex-col gap-2">
										{bubbleContent ? (
											<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>{bubbleContent}</span>
										) : (
											isAssistant && !isStreaming ? (
												<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>Thinking…</span>
											) : null
										)}
										{isAssistant && isStreaming && (
											<span className="flex items-center gap-1 text-[0.75rem] text-[color:var(--fg)]/60" aria-live="assertive">
												<span className="sr-only">Assistant is responding</span>
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse" />
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:150ms]" />
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:300ms]" />
											</span>
										)}
										{isAssistant && totalSources > 0 && (
											<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
												<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Cited</span>
												{sources.map((source, index) => (
													<button
														key={`${message.id}-citation-${index}`}
														type="button"
														className="rounded-full border border-[color:var(--accent)]/30 px-2 py-0.5 text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
														onClick={() => handleOpenPrimarySource(source.url)}
													>
														[{index + 1}]
													</button>
												))}
											</div>
										)}
									</div>
								</div>
								{isAssistant && totalSources > 0 && (
									<div className="mt-1 flex flex-col gap-2 text-xs" aria-label="Referenced sources">
										<div className="flex flex-wrap items-center gap-2">
											<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Sources</span>
											{primarySource && primarySourceTitle && (
												<a
													href={primarySource.url}
													target={primaryLinkTarget}
													rel={primaryLinkRel}
													className="max-w-full min-w-0 break-words whitespace-normal rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-left text-[0.65rem] leading-tight text-[color:var(--accent)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
												>
													{primarySourceTitle}
												</a>
											)}
											{totalSources > 1 && !showAllSources && (
												<span className="text-[color:var(--fg)]/50">+{totalSources - 1} more</span>
											)}
											<button
												type="button"
												className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-[0.65rem] text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
												onClick={() => toggleExpandedSourcesForMessage(message.id)}
											>
												{showAllSources ? 'Hide details' : totalSources > 1 ? `Show all (${totalSources})` : 'Show details'}
											</button>
										</div>
										{showAllSources && (
											<ul className="flex flex-col gap-2">
												{sources.map((source, index) => {
												const relevance = typeof source.score === 'number' ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100) : null;
												const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || ''));
												const displayTitle = title || decodeMimeEncodedWords(decodeHtmlEntities(source.url));
												const snippetSource = source.summary || source.snippet || '';
												const snippet = snippetSource ? cleanSnippet(snippetSource) : '';
												const publishedLabel = formatPublishedDate(source.publishedAt ?? undefined);
												let isExternalLink = false;
												try {
													const parsed = source.url.startsWith('http')
														? new URL(source.url)
														: new URL(source.url, `https://${siteHostname}`);
													isExternalLink = parsed.hostname !== siteHostname;
												} catch {
													isExternalLink = !source.url.startsWith('/');
												}
												const linkTarget = isExternalLink ? '_blank' : undefined;
												const linkRel = isExternalLink ? 'noreferrer' : undefined;
												return (
													<li
														key={`${message.id}-source-${index}`}
														className="group w-full rounded-2xl border border-[color:var(--border)]/40 bg-gradient-to-br from-[color:var(--surface-subtle)]/40 to-[color:var(--surface)]/20 px-4 py-3 text-left text-[color:var(--fg)]/80 shadow-sm transition hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--surface)]/60 hover:shadow-md"
													>
														<div className="flex items-start gap-3">
															<div className="flex shrink-0 items-center gap-2">
																<span className="inline-flex size-6 items-center justify-center rounded-full bg-[color:var(--accent)]/15 text-xs font-bold text-[color:var(--accent)]">{index + 1}</span>
																{source.icon && <span className="shrink-0 text-xl" aria-hidden="true">{source.icon}</span>}
															</div>
															<div className="min-w-0 flex-1">
																<a
																	ref={(element) => {
																	if (element) sourceRefs.current.push(element);
																	}}
																	href={source.url}
																	tabIndex={0}
																	target={linkTarget}
																	rel={linkRel}
																	className="block font-medium text-[color:var(--accent)] underline decoration-dotted underline-offset-2 transition group-hover:text-[color:var(--accent-strong)]"
																>
																	{displayTitle}
																</a>
																<div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-[color:var(--fg)]/60">
																	{source.collection && (
																		<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/15 px-2.5 py-0.5 font-semibold text-[color:var(--accent-strong)]">
																			{source.collection === 'blog' && '📝'}
																			{source.collection === 'projects' && '🚀'}
																			{source.collection !== 'blog' && source.collection !== 'projects' && '📄'}
																			{source.collection}
																		</span>
																	)}
																	{relevance !== null && (
																		<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[color:var(--accent)]/20 to-[color:var(--accent)]/10 px-2.5 py-0.5 font-bold text-[color:var(--accent-strong)]">
																			<svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
																			</svg>
																			{relevance}%
																		</span>
																	)}
																	{publishedLabel && (
																		<time className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/60 px-2.5 py-0.5" dateTime={source.publishedAt ?? undefined}>
																			<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
																			</svg>
																			{publishedLabel}
																		</time>
																	)}
																	{isExternalLink && (
																		<span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/40 px-2.5 py-0.5 text-[color:var(--fg)]/50">
																			External
																			<svg className="size-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5h7.06m0 0v7.06m0-7.06-8.12 8.12" />
																			</svg>
																		</span>
																	)}
																</div>
																{snippet && (
																	<p className="mt-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/30 px-3 py-2 text-xs leading-relaxed text-[color:var(--fg)]/70">
																		<span className="font-medium text-[color:var(--fg)]/50">Preview: </span>
																		{snippet}
																	</p>
																)}
															</div>
														</div>
													</li>
												);
											})}
										</ul>
									)}
								</div>
								)}
								{isAssistant && sources.length > 0 && (() => {
									const messageIndex = messages.findIndex((m) => m.id === message.id);
									const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
									const matchedCTA = CONTEXTUAL_CTAS.find((cta) => cta.condition(userQuery, sources));
									
									if (matchedCTA) {
										return (
											<div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30">
												<div className="flex items-start gap-3">
													<span className="shrink-0 text-2xl" aria-hidden="true">
														{matchedCTA.icon}
													</span>
													<div className="flex-1">
														<p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{matchedCTA.message}</p>
														<a
															href={matchedCTA.ctaLink}
															className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
															onClick={() => {
																if (typeof window !== 'undefined' && (window as any).plausible) {
																	(window as any).plausible('AutoRAG CTA Click', {
																		props: { cta: matchedCTA.ctaText, query: userQuery },
																	});
																}
															}}
														>
															{matchedCTA.ctaText}
															<svg
																className="size-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
															</svg>
														</a>
													</div>
												</div>
											</div>
										);
									}
									return null;
								})()}
								{isAssistant && sources.length > 0 && (() => {
									// Generate dynamic follow-up suggestions based on sources
									const suggestions: Array<{ label: string; query: string; icon: string }> = [];
									
									// Extract unique collections
									const collections = [...new Set(sources.map((s) => s.collection).filter(Boolean))] as string[];
									
									// Suggest exploring specific collections
									if (collections.includes('projects')) {
										const projectSources = sources.filter((s) => s.collection === 'projects');
										if (projectSources.length > 0) {
											const projectTitle = projectSources[0].title;
											suggestions.push({
												label: 'Project details',
												query: `Tell me more about the ${projectTitle} project`,
												icon: '🔍',
											});
										}
									}
									
									if (collections.includes('blog')) {
										const blogSources = sources.filter((s) => s.collection === 'blog');
										if (blogSources.length > 0) {
											const blogTitle = blogSources[0].title;
											suggestions.push({
												label: 'Related article',
												query: `What else has Blake written about topics in "${blogTitle}"?`,
												icon: '📚',
											});
										}
									}
									
									// Suggest digging deeper into top source
									if (sources[0] && sources[0].title) {
										const topSourceTitle = sources[0].title;
										if (!suggestions.some((s) => s.query.includes(topSourceTitle))) {
											suggestions.push({
												label: 'Deep dive',
												query: `Can you explain "${topSourceTitle}" in more detail?`,
												icon: '💡',
											});
										}
									}
									
									// Suggest comparing if multiple sources
									if (sources.length >= 2 && sources[0].title && sources[1].title) {
										suggestions.push({
											label: 'Compare',
											query: `How does "${sources[0].title}" compare to "${sources[1].title}"?`,
											icon: '⚖️',
										});
									}
									
									// Limit to 3 suggestions
									const limitedSuggestions = suggestions.slice(0, 3);
									
									if (limitedSuggestions.length === 0) return null;
									
									return (
										<div className="mt-3 space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg)]/50">
												Keep exploring
											</p>
											<div className="flex flex-wrap gap-2">
												{limitedSuggestions.map((suggestion, index) => (
													<button
														key={index}
														type="button"
														onClick={() => {
															setInputValue(suggestion.query);
															setTimeout(() => sendQuery(suggestion.query), 100);
															
															if ((window as any).plausible) {
																(window as any).plausible('AutoRAG Suggested Query', {
																	props: { type: suggestion.label },
																});
															}
														}}
														className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1.5 text-xs text-[color:var(--fg)]/80 transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent)]/10 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
													>
														<span className="text-sm" aria-hidden="true">{suggestion.icon}</span>
														{suggestion.label}
													</button>
												))}
											</div>
										</div>
									);
								})()}
								{isAssistant && (
									<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
										<button
											type="button"
											className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
											onClick={() => handleCopyMessage(message)}
										>
											{copiedMessageId === message.id ? 'Copied' : 'Copy answer'}
										</button>
										<button
											type="button"
											className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
											title="Share this query"
											onClick={() => {
												const messageIndex = messages.findIndex((m) => m.id === message.id);
												const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
												const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(userQuery)}&autosubmit=true`;
												
												if (navigator.share) {
													navigator.share({
														title: 'AutoRAG Query Result',
														text: `Check out this answer from Blake's AI assistant: "${userQuery}"`,
														url: shareUrl,
													}).then(() => {
														if ((window as any).plausible) {
															(window as any).plausible('AutoRAG Share', { props: { method: 'native' } });
														}
													}).catch(() => {/* User cancelled */});
												} else {
													navigator.clipboard.writeText(shareUrl).then(() => {
														setCopiedShareUrl(message.id);
														setTimeout(() => setCopiedShareUrl(null), 2000);
														if ((window as any).plausible) {
															(window as any).plausible('AutoRAG Share', { props: { method: 'clipboard' } });
														}
													}).catch(() => {/* Clipboard failed */});
												}
											}}
										>
											{copiedShareUrl === message.id ? (
												<>
													<svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
													</svg>
													Copied!
												</>
											) : (
												<>
													<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
													</svg>
													Share
												</>
											)}
										</button>
										{primarySource?.url && (
											<button
												type="button"
												className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
												onClick={() => handleOpenPrimarySource(primarySource.url)}
											>
												View top source
											</button>
										)}
										<div className="ml-auto inline-flex items-center gap-1">
											<button
												type="button"
												className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
													isHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
												}`}
												aria-label={isHelpful ? 'Marked helpful' : 'Mark answer helpful'}
												onClick={() => handleFeedback(message.id, 'positive')}
											>
												👍
											</button>
											<button
												type="button"
												className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
													isNotHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
												}`}
												aria-label={isNotHelpful ? 'Marked not helpful' : 'Mark answer not helpful'}
												onClick={() => handleFeedback(message.id, 'negative')}
											>
												👎
											</button>
										</div>
									</div>
								)}
							</div>
						);
						})}
					</div>
					{showScrollToLatest && (
						<button
							type="button"
							onClick={scrollToLatest}
							className="pointer-events-auto absolute bottom-5 right-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[color:var(--fg)]/70 shadow-sm backdrop-blur transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							aria-label="Jump to latest message"
						>
							<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="m5 8 5 5 5-5" />
							</svg>
							<span>Jump to latest</span>
						</button>
					)}
				</div>

				{chatState === 'loading' && (
					<div className="flex items-center gap-2 text-sm text-[color:var(--fg)]/70">
						<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
						</svg>
						{loadingPhase === 'searching' && 'Searching knowledge base...'}
						{loadingPhase === 'analyzing' && 'Analyzing sources...'}
						{loadingPhase === 'crafting' && 'Crafting response...'}
						{!loadingPhase && 'Thinking through the best answer...'}
					</div>
				)}

				{isListening && (
					<div className="flex items-center gap-2 text-xs text-[color:var(--accent-strong)]">
						<span className="inline-flex size-2 rounded-full bg-[color:var(--accent-strong)]" aria-hidden="true" />
						Listening{interimTranscript ? `: ${interimTranscript}` : ''}
					</div>
				)}

				{error && (
					<div className="rounded-xl border border-red-400/60 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/60 dark:bg-red-900/30 dark:text-red-200">
						<p>{error}</p>
						{lastQueryValue && (
							<p className="mt-1 text-[color:var(--fg)]/60 dark:text-red-200/80">
								Last question: <span className="font-medium text-[color:var(--fg)]">{lastQueryValue}</span>
							</p>
						)}
						<div className="mt-2 flex flex-wrap gap-2">
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-full border border-red-400/60 px-3 py-1 font-medium transition hover:border-red-500 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:opacity-60 dark:hover:border-red-400 dark:hover:text-red-100"
								onClick={retryLastQuery}
								disabled={!canRetry}
							>
								Try again
							</button>
							<a
								href="/projects"
								className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							>
								Browse projects
							</a>
							<a
								href="/contact"
								className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							>
								Contact Blake
							</a>
						</div>
					</div>
				)}

				{fallbackResults.length > 0 && (
					<div className="min-w-0 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/30 p-3 text-xs text-[color:var(--fg)]/70">
						<div className="flex items-center justify-between gap-2">
							<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Related suggestions</span>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.625rem] font-medium text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
								onClick={() => setShowFallbackSuggestions((previous) => !previous)}
							>
								{showFallbackSuggestions ? 'Hide' : `Show all (${fallbackResults.length})`}
							</button>
						</div>
						<ul className="mt-2 flex flex-wrap gap-2">
							{visibleFallbackResults.map((result, index) => (
								<li
									key={`fallback-${index}`}
									className="group flex min-w-0 max-w-full flex-1 flex-col gap-1 rounded-2xl border border-[color:var(--border)]/35 bg-[color:var(--surface)]/70 px-3 py-2 transition hover:border-[color:var(--accent)]/40"
								>
									<a
										href={result.url}
										className="truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2 group-hover:text-[color:var(--accent-strong)]"
										target="_blank"
										rel="noreferrer"
									>
										{result.title}
									</a>
									{showFallbackSuggestions && result.excerpt && (
										<p className="line-clamp-2 break-words text-[color:var(--fg)]/60">{result.excerpt}</p>
									)}
								</li>
							))}
						</ul>
						{hasMoreFallbackResults && !showFallbackSuggestions && (
							<p className="mt-1 text-[0.6rem] text-[color:var(--fg)]/50">Showing top {visibleFallbackResults.length} of {fallbackResults.length} matches.</p>
						)}
					</div>
				)}

				{canStartNewChat && (
					<div className="flex items-center justify-between gap-2 border-t border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/35 px-4 py-2 text-[0.7rem] text-[color:var(--fg)]/65">
						<span className="truncate pr-2">Want to start fresh?</span>
						<button
							type="button"
							className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-3 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45"
							onClick={startNewChat}
						>
							<span>Start new chat</span>
							<svg className="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-6-6 6 6-6 6" />
							</svg>
						</button>
					</div>
				)}

				<form className="border-t border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-4 py-3" onSubmit={handleSubmit}>
					<div className="relative">
						<textarea
							id="ai-chat-input"
							ref={inputRef}
							className="h-24 w-full resize-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/70 px-4 pb-3 pr-12 pt-6 text-sm text-[color:var(--fg)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/40"
							placeholder=""
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={handleTextareaKeyDown}
							onFocus={() => setComposerFocused(true)}
							onBlur={() => setComposerFocused(false)}
							disabled={chatState === 'loading'}
							required
							rows={3}
						/>
						<label
							htmlFor="ai-chat-input"
							className={`pointer-events-none absolute left-4 font-medium text-[color:var(--fg)]/60 transition-all duration-150 ease-out ${
								floatingLabelActive ? 'top-2 text-[0.7rem] opacity-85' : 'top-4 text-sm opacity-70'
							}`}
						>
							Ask about projects, case studies, or posts…
						</label>
						<button
							type="submit"
							className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--on-accent)] shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 active:scale-95 disabled:opacity-50"
							aria-label={chatState === 'loading' ? 'Sending message' : 'Send message'}
							disabled={chatState === 'loading'}
						>
							{chatState === 'loading' ? (
								<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
								</svg>
							) : (
								<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 3m0-6L5 12m13.5-7.5-13 7a1 1 0 0 0 0 1.8l13 7A1 1 0 0 0 20 20.5v-17a1 1 0 0 0-1.5-.9Z" />
								</svg>
							)}
						</button>
					</div>
					<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
						<span>Shift+Enter for a new line</span>
						<span className="flex gap-2">
							<span className="whitespace-nowrap">⌘K / Ctrl+K reopens</span>
							<span className="whitespace-nowrap">/ focuses input</span>
						</span>
					</div>
				</form>
			</div>
		</div>
	);
}
