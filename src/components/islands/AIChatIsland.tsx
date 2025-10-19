import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AIChatMessage, AIChatSource } from '../../lib/ai-search';
import { AISearchError, searchWithAI } from '../../lib/ai-search';

const CONVERSATION_STORAGE_KEY = 'ai-chat:conversation';
const PREFERENCES_STORAGE_KEY = 'ai-chat:preferences';
const FALLBACK_SEARCH_INDEX_URL = '/search/index.json';

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

type ChatState = 'idle' | 'loading' | 'ready';

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

type SearchIndexEntry = {
	title?: string;
	url?: string;
	slug?: string;
	type?: string;
	description?: string;
	summary?: string;
	body?: string;
	tags?: string[];
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
		'Hi! I\'m the AI search assistant for this site. Ask anything about Blake\'s work, projects, or posts and I\'ll pull the most relevant answers.',
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

function formatPublishedDate(value?: string): string | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function deriveEntryUrl(entry: SearchIndexEntry): string | null {
	if (entry.url) return entry.url;
	const slug = typeof entry.slug === 'string' ? entry.slug.replace(/^\/+/, '') : '';
	if (!slug) return null;
	const type = (entry.type || '').toLowerCase();
	if (type === 'project' || type === 'projects') {
		return `/projects/${slug}`;
	}
	if (type === 'blog' || type === 'post' || type === 'article') {
		return `/blog/${slug}`;
	}
	return `/${slug}`;
}

function scoreFallbackEntry(words: string[], entry: SearchIndexEntry): number {
	if (words.length === 0) return 0;
	const haystack = [entry.title, entry.description, entry.summary, entry.body, entry.tags?.join(' ')].filter(Boolean).join(' ').toLowerCase();
	if (!haystack) return 0;
	let score = 0;
	for (const word of words) {
		if (haystack.includes(word)) {
			score += 3;
		}
	}
	if (entry.title) {
		const title = entry.title.toLowerCase();
		for (const word of words) {
			if (title.includes(word)) {
				score += 2;
			}
		}
	}
	return score;
}

export default function AIChatIsland() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
	const [inputValue, setInputValue] = useState('');
	const [chatState, setChatState] = useState<ChatState>('idle');
	const [error, setError] = useState<string | null>(null);
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
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
	const [showDigest, setShowDigest] = useState(false);
	const [showAnalytics, setShowAnalytics] = useState(false);
	const [showAdvancedControls, setShowAdvancedControls] = useState(false);
	const [voiceSupported, setVoiceSupported] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [interimTranscript, setInterimTranscript] = useState('');
	const [fallbackResults, setFallbackResults] = useState<SearchFallback[]>([]);
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
	const searchIndexRef = useRef<SearchIndexEntry[] | null>(null);
	const sourceRefs = useRef<HTMLAnchorElement[]>([]);

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

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
		if (lastFocusedElement.current && typeof lastFocusedElement.current.focus === 'function') {
			requestAnimationFrame(() => {
				lastFocusedElement.current?.focus();
			});
		}
	}, [isListening, isOpen]);

	const buildHistoryForRequest = useCallback((): AIChatMessage[] => {
		if (!useMemory) return [];
		return messagesRef.current
			.filter((message) => message.role === 'user' || message.role === 'assistant')
			.slice(-10)
			.map((message) => ({ role: message.role, content: message.content }));
	}, [useMemory]);

	const ensureSearchIndex = useCallback(async (): Promise<SearchIndexEntry[]> => {
		if (searchIndexRef.current) return searchIndexRef.current;
		try {
			const response = await fetch(FALLBACK_SEARCH_INDEX_URL, {
				headers: { accept: 'application/json' },
			});
			if (!response.ok) {
				searchIndexRef.current = [];
				return [];
			}
			const data = await response.json();
			if (Array.isArray(data)) {
				searchIndexRef.current = data;
				return data;
			}
		} catch {
			searchIndexRef.current = [];
			return [];
		}
		searchIndexRef.current = [];
		return [];
	}, []);

	const updateFallbackSuggestions = useCallback(
		async (query: string) => {
			const normalized = query.toLowerCase().trim();
			if (!normalized) {
				setFallbackResults([]);
				return;
			}
			const words = normalized.split(/\s+/).filter((word) => word.length > 2);
			if (words.length === 0) {
				setFallbackResults([]);
				return;
			}
			const index = await ensureSearchIndex();
			if (!index || index.length === 0) {
				setFallbackResults([]);
				return;
			}
			const ranked = index
				.map((entry) => {
					const url = deriveEntryUrl(entry);
					if (!url) return null;
					const score = scoreFallbackEntry(words, entry);
					if (score <= 0) return null;
					const excerptSource = entry.summary || entry.description || entry.body;
					const excerpt = excerptSource ? cleanSnippet(excerptSource) : undefined;
					const titleSource = entry.title || url.replace(/^\//, '');
					const title = decodeMimeEncodedWords(titleSource).trim() || url.replace(/^\//, '');
					return { title, url, excerpt, score } as SearchFallback;
				})
				.filter((value): value is SearchFallback => Boolean(value))
				.sort((a, b) => b.score - a.score)
				.slice(0, 3);
			setFallbackResults(ranked);
		},
		[ensureSearchIndex],
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
		lastQueryRef.current = null;
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
			} catch {
				/* ignore clear failures */
			}
		}
	}, []);

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

			try {
				await searchWithAI(query, {
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
					},
					onCompletion: (message) => {
						replaceAssistantContent(assistantId, message.trim());
					},
				});
				setStreamingMessageId(null);
				setChatState('ready');
				await updateFallbackSuggestions(query);
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}
				setStreamingMessageId(null);
				setChatState('ready');
				setMessages((prev) => prev.filter((message) => message.id !== assistantId));
				const message = err instanceof AISearchError ? err.message : 'Unable to reach the AI assistant right now. Please try again.';
				setError(message);
				await updateFallbackSuggestions(query);
			} finally {
				activeRequestRef.current = null;
			}
		},
		[appendAssistantChunk, assignAssistantSources, buildHistoryForRequest, replaceAssistantContent, updateFallbackSuggestions],
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
		if (!scrollContainerRef.current) return;
		scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight });
	}, [messages]);

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

	return (
		<div className="ai-chat-wrapper pointer-events-none fixed bottom-4 right-4 z-[1050] flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6">
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
				className={`ai-chat-panel pointer-events-auto w-[min(90vw,24rem)] overflow-hidden rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/80 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.65)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/80 transition-transform duration-200 ease-out ${
					isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
				}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ai-chat-heading"
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
								className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] ${
									isListening ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
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
							className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] ${
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
							className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition hover:border-[color:var(--border)] hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
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
					<div className={`flex flex-col gap-3 ${showAdvancedControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								className={`inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
								useMemory ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : ''
							}`}
								aria-label={useMemory ? 'Disable conversation memory' : 'Enable conversation memory'}
								onClick={toggleMemory}
							>
								{useMemory ? 'Memory on' : 'Memory off'}
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
								showDigest ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : ''
							}`}
								aria-label={showDigest ? 'Hide conversation digest' : 'Show conversation digest'}
								onClick={toggleDigest}
							>
								Digest
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
								showAnalytics ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : ''
							}`}
								aria-label={showAnalytics ? 'Hide insights' : 'Show insights'}
								onClick={toggleAnalytics}
							>
								Insights
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
								onClick={clearConversation}
							>
								Clear
							</button>
						</div>
						{feedbackAnalytics.totalAssistant > 0 && (
							<div className="grid w-full gap-2 sm:grid-cols-2">
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

				<div ref={scrollContainerRef} className="flex max-h-80 flex-col gap-4 overflow-y-auto px-4 py-4" aria-live="polite">
					{messages.map((message) => {
						const alignment = message.role === 'user' ? 'items-end text-right' : 'items-start text-left';
						const bubbleClasses = message.role === 'user'
							? 'bg-[color:var(--accent)] text-[color:var(--on-accent)]'
							: 'bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90';
						const isAssistant = message.role === 'assistant';
						const bubbleContent = message.content || (streamingMessageId === message.id ? '…' : '');
						const primarySource = isAssistant && message.sources && message.sources[0] ? message.sources[0] : null;
						const isHelpful = message.feedback === 'positive';
						const isNotHelpful = message.feedback === 'negative';
						const messageTextClasses = isAssistant ? 'text-[0.95rem] leading-relaxed' : 'text-[0.9rem] leading-snug';

						return (
							<div key={message.id} className={`flex flex-col gap-2 ${alignment}`}>
								<div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-[color:var(--border)]/20 dark:ring-[color:var(--border)]/30 ${bubbleClasses}`}>
									<div className="flex flex-col gap-2">
										<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>{bubbleContent || (isAssistant ? 'Thinking…' : '')}</span>
										{isAssistant && message.sources && message.sources.length > 0 && (
											<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
												<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Cited</span>
												{message.sources.map((source, index) => (
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
								{isAssistant && message.sources && message.sources.length > 0 && (
									<div className="mt-1 flex flex-col gap-2 text-xs" aria-label="Referenced sources">
										<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Sources</span>
										<ul className="flex flex-col gap-2">
											{message.sources.map((source, index) => {
												const relevance = typeof source.score === 'number' ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100) : null;
												const title = decodeHtmlEntities(source.title || '');
												const displayTitle = title || decodeHtmlEntities(source.url);
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
														className="group rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/40 px-3 py-2 text-left text-[color:var(--fg)]/80 transition hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--surface)]/60"
													>
														<div className="flex min-w-0 flex-wrap items-center gap-2">
															<span className="inline-flex size-5 items-center justify-center rounded-full bg-[color:var(--accent)]/10 font-semibold text-[color:var(--accent)]">{index + 1}</span>
															{source.icon && <span className="text-base" aria-hidden="true">{source.icon}</span>}
															<a
																ref={(element) => {
																	if (element) sourceRefs.current.push(element);
																}}
																href={source.url}
																tabIndex={0}
																target={linkTarget}
																rel={linkRel}
																className="block max-w-full truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2 transition group-hover:text-[color:var(--accent-strong)]"
															>
																{displayTitle}
															</a>
															{source.collection && (
																<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 text-[0.65rem] font-medium text-[color:var(--accent-strong)]">{source.collection}</span>
															)}
															{isExternalLink && (
																<span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2 py-0.5 text-[0.65rem] text-[color:var(--fg)]/60">
																	External
																	<svg className="size-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
																		<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5h7.06m0 0v7.06m0-7.06-8.12 8.12" />
																	</svg>
																</span>
															)}
															{publishedLabel && (
																<time className="text-[0.65rem] text-[color:var(--fg)]/60" dateTime={source.publishedAt ?? undefined}>
																	{publishedLabel}
																</time>
															)}
															{relevance !== null && (
																<span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 text-[0.65rem] font-medium text-[color:var(--accent-strong)]">{relevance}% match</span>
															)}
														</div>
														{snippet && <p className="mt-1 min-w-0 break-words line-clamp-3 text-[color:var(--fg)]/65">{snippet}</p>}
													</li>
												);
											})}
										</ul>
									</div>
								)}
								{isAssistant && (
									<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
										<button
											type="button"
											className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
											onClick={() => handleCopyMessage(message)}
										>
											{copiedMessageId === message.id ? 'Copied' : 'Copy answer'}
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

					{chatState === 'loading' && (
						<div className="flex items-center gap-2 text-sm text-[color:var(--fg)]/70">
							<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
							</svg>
							Thinking through the best answer…
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
							<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Related suggestions</span>
							<ul className="mt-2 space-y-2">
								{fallbackResults.map((result, index) => (
									<li key={`fallback-${index}`} className="flex min-w-0 flex-col gap-1 rounded-xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/80 p-2 transition hover:border-[color:var(--accent)]/50">
										<a href={result.url} className="block max-w-full truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2" target="_blank" rel="noreferrer">
											{result.title}
										</a>
										{result.excerpt && <p className="line-clamp-2 break-words text-[color:var(--fg)]/60">{result.excerpt}</p>}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<form className="border-t border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-4 py-3" onSubmit={handleSubmit}>
					<label htmlFor="ai-chat-input" className="sr-only">
						Ask the assistant
					</label>
					<div className="relative">
						<textarea
							id="ai-chat-input"
							ref={inputRef}
							className="h-24 w-full resize-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/70 px-4 pb-3 pr-12 pt-3 text-sm text-[color:var(--fg)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/40"
							placeholder="Ask about projects, case studies, or posts…"
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={handleTextareaKeyDown}
							disabled={chatState === 'loading'}
							required
							rows={3}
						/>
						<button
							type="submit"
							className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--on-accent)] shadow-sm transition hover:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 disabled:opacity-50"
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
