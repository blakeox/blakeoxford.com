/**
 * Voice Recognition Hook
 * 
 * Custom React hook for managing speech recognition functionality.
 * Provides voice input capabilities with real-time transcription and error handling.
 * 
 * @module hooks/useVoiceRecognition
 */

import { useEffect, useRef, useState } from 'react';
import type { SpeechRecognitionLike } from '../chat';

export interface UseVoiceRecognitionOptions {
	/** Callback invoked when final transcript is ready */
	onTranscript?: (transcript: string) => void;
	/** Language code for recognition (default: 'en-US') */
	language?: string;
	/** Enable continuous recognition (default: false) */
	continuous?: boolean;
	/** Enable interim results (default: true) */
	interimResults?: boolean;
	/** Maximum alternatives to return (default: 1) */
	maxAlternatives?: number;
}

export interface UseVoiceRecognitionReturn {
	/** Whether voice recognition is supported in current browser */
	voiceSupported: boolean;
	/** Whether recognition is currently active */
	isListening: boolean;
	/** Current interim transcript (not finalized) */
	interimTranscript: string;
	/** Start voice recognition */
	startListening: () => void;
	/** Stop voice recognition */
	stopListening: () => void;
	/** Toggle voice recognition on/off */
	toggleListening: () => void;
}

/**
 * Custom hook for managing speech recognition with Web Speech API
 * 
 * Provides voice input functionality with support for both Chrome's
 * webkitSpeechRecognition and standard SpeechRecognition API.
 * 
 * Features:
 * - Automatic browser compatibility detection
 * - Real-time interim results
 * - Final transcript callback
 * - Error handling with auto-stop
 * - Cleanup on unmount
 * 
 * @param options - Configuration options for voice recognition
 * @returns Voice recognition state and control functions
 * 
 * @example
 * ```tsx
 * const { voiceSupported, isListening, interimTranscript, toggleListening } = 
 *   useVoiceRecognition({
 *     onTranscript: (text) => setInputValue(prev => `${prev} ${text}`.trim()),
 *     language: 'en-US'
 *   });
 * ```
 */
export function useVoiceRecognition(
	options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
	const {
		onTranscript,
		language = 'en-US',
		continuous = false,
		interimResults = true,
		maxAlternatives = 1,
	} = options;

	const [voiceSupported, setVoiceSupported] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [interimTranscript, setInterimTranscript] = useState('');
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

	// Initialize speech recognition
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const globalWindow = window as typeof window & {
			SpeechRecognition?: new () => SpeechRecognitionLike;
			webkitSpeechRecognition?: new () => SpeechRecognitionLike;
		};

		const RecognitionCtor =
			globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;

		if (!RecognitionCtor) {
			setVoiceSupported(false);
			return;
		}

		const recognition = new RecognitionCtor();
		recognition.lang = language;
		recognition.continuous = continuous;
		recognition.interimResults = interimResults;
		recognition.maxAlternatives = maxAlternatives;

		// Handle recognition results
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

			// Notify parent component of final transcript
			if (finalTranscript.trim() && onTranscript) {
				onTranscript(finalTranscript.trim());
			}

			// Update interim transcript for display
			setInterimTranscript(interim.trim());
		};

		// Handle recognition errors
		recognition.onerror = () => {
			setIsListening(false);
			setInterimTranscript('');
		};

		// Handle recognition end
		recognition.onend = () => {
			setIsListening(false);
			setInterimTranscript('');
		};

		recognitionRef.current = recognition;
		setVoiceSupported(true);

		// Cleanup
		return () => {
			recognition.onresult = null;
			recognition.onerror = null;
			recognition.onend = null;
			try {
				recognition.stop();
			} catch {
				/* ignore stop failures */
			}
		};
	}, [language, continuous, interimResults, maxAlternatives, onTranscript]);

	// Start listening
	const startListening = () => {
		if (!voiceSupported || !recognitionRef.current || isListening) return;

		try {
			setInterimTranscript('');
			recognitionRef.current.start();
			setIsListening(true);
		} catch {
			setIsListening(false);
		}
	};

	// Stop listening
	const stopListening = () => {
		if (!voiceSupported || !recognitionRef.current || !isListening) return;

		try {
			recognitionRef.current.stop();
		} catch {
			/* ignore stop failures */
		}
		setIsListening(false);
		setInterimTranscript('');
	};

	// Toggle listening
	const toggleListening = () => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	};

	return {
		voiceSupported,
		isListening,
		interimTranscript,
		startListening,
		stopListening,
		toggleListening,
	};
}
