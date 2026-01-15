/**
 * Unified Error Utilities
 * 
 * Provides standardized error handling utilities for the application.
 * These utilities work with the existing ErrorHandlingSystem for UI errors
 * and provide type-safe error creation for API and business logic errors.
 * 
 * @module utils/errors
 */

import type { ApiError } from '../types/api';

// ─── Error Types ──────────────────────────────────────────────────────────────

/**
 * Application error codes for consistent error identification
 */
export const ErrorCodes = {
	// Network errors
	NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
	NETWORK_OFFLINE: 'NETWORK_OFFLINE',
	NETWORK_UNKNOWN: 'NETWORK_UNKNOWN',
	
	// API errors
	API_NOT_FOUND: 'API_NOT_FOUND',
	API_UNAUTHORIZED: 'API_UNAUTHORIZED',
	API_FORBIDDEN: 'API_FORBIDDEN',
	API_RATE_LIMITED: 'API_RATE_LIMITED',
	API_SERVER_ERROR: 'API_SERVER_ERROR',
	API_VALIDATION_ERROR: 'API_VALIDATION_ERROR',
	
	// Chat/AI errors
	CHAT_CONNECTION_FAILED: 'CHAT_CONNECTION_FAILED',
	CHAT_MESSAGE_FAILED: 'CHAT_MESSAGE_FAILED',
	CHAT_TIMEOUT: 'CHAT_TIMEOUT',
	AI_INFERENCE_ERROR: 'AI_INFERENCE_ERROR',
	AI_RATE_LIMITED: 'AI_RATE_LIMITED',
	
	// Form errors
	FORM_VALIDATION_ERROR: 'FORM_VALIDATION_ERROR',
	FORM_SUBMISSION_ERROR: 'FORM_SUBMISSION_ERROR',
	
	// Generic errors
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
	INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ─── Custom Error Class ───────────────────────────────────────────────────────

/**
 * Application-specific error class with structured metadata
 */
export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly details?: Record<string, unknown>;
	public readonly timestamp: string;
	public readonly isRetryable: boolean;
	public readonly userMessage: string;

	constructor(
		message: string,
		code: ErrorCode = ErrorCodes.UNKNOWN_ERROR,
		options: {
			details?: Record<string, unknown>;
			isRetryable?: boolean;
			userMessage?: string;
			cause?: Error;
		} = {}
	) {
		super(message, { cause: options.cause });
		this.name = 'AppError';
		this.code = code;
		this.details = options.details;
		this.timestamp = new Date().toISOString();
		this.isRetryable = options.isRetryable ?? false;
		this.userMessage = options.userMessage ?? getDefaultUserMessage(code);
	}

	/**
	 * Convert to ApiError format for API responses
	 */
	toApiError(): ApiError {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
			stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
		};
	}

	/**
	 * Create from unknown error
	 */
	static from(error: unknown, code?: ErrorCode): AppError {
		if (error instanceof AppError) {
			return error;
		}

		if (error instanceof Error) {
			return new AppError(error.message, code ?? ErrorCodes.UNKNOWN_ERROR, {
				cause: error,
				details: { originalName: error.name },
			});
		}

		return new AppError(
			typeof error === 'string' ? error : 'An unknown error occurred',
			code ?? ErrorCodes.UNKNOWN_ERROR
		);
	}
}

// ─── Error Creation Helpers ───────────────────────────────────────────────────

/**
 * Create a network error
 */
export function createNetworkError(
	message: string,
	options: { status?: number; url?: string } = {}
): AppError {
	const code = options.status
		? getErrorCodeFromStatus(options.status)
		: ErrorCodes.NETWORK_UNKNOWN;

	return new AppError(message, code, {
		details: { status: options.status, url: options.url },
		isRetryable: isRetryableStatus(options.status),
	});
}

/**
 * Create an API error from a Response object
 */
export async function createApiErrorFromResponse(response: Response): Promise<AppError> {
	const code = getErrorCodeFromStatus(response.status);
	let message = response.statusText || getDefaultMessage(code);
	let details: Record<string, unknown> = {
		status: response.status,
		url: response.url,
	};

	try {
		const body = await response.json();
		if (body.message) message = body.message;
		if (body.details) details = { ...details, ...body.details };
	} catch {
		// Response body is not JSON, use default message
	}

	return new AppError(message, code, {
		details,
		isRetryable: isRetryableStatus(response.status),
	});
}

/**
 * Create a chat/AI error
 */
export function createChatError(
	message: string,
	code: ErrorCode = ErrorCodes.CHAT_MESSAGE_FAILED,
	details?: Record<string, unknown>
): AppError {
	return new AppError(message, code, {
		details,
		isRetryable: code !== ErrorCodes.AI_RATE_LIMITED,
		userMessage: getChatErrorMessage(code),
	});
}

// ─── Error Type Guards ────────────────────────────────────────────────────────

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
	if (error instanceof AppError) {
		return error.isRetryable;
	}
	
	// Network errors are generally retryable
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return true;
	}
	
	return false;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
	if (error instanceof AppError) {
		const networkCodes: ErrorCode[] = [
			ErrorCodes.NETWORK_TIMEOUT,
			ErrorCodes.NETWORK_OFFLINE,
			ErrorCodes.NETWORK_UNKNOWN,
		];
		return networkCodes.includes(error.code);
	}
	
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return true;
	}
	
	return false;
}

// ─── Error Message Utilities ──────────────────────────────────────────────────

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
	if (error instanceof AppError) {
		return error.userMessage;
	}
	
	if (error instanceof Error) {
		// Don't expose technical details to users
		return 'An unexpected error occurred. Please try again.';
	}
	
	return typeof error === 'string' ? error : 'Something went wrong.';
}

/**
 * Get error code from HTTP status
 */
function getErrorCodeFromStatus(status?: number): ErrorCode {
	if (!status) return ErrorCodes.NETWORK_UNKNOWN;
	
	switch (status) {
		case 400:
			return ErrorCodes.API_VALIDATION_ERROR;
		case 401:
			return ErrorCodes.API_UNAUTHORIZED;
		case 403:
			return ErrorCodes.API_FORBIDDEN;
		case 404:
			return ErrorCodes.API_NOT_FOUND;
		case 429:
			return ErrorCodes.API_RATE_LIMITED;
		case 500:
		case 502:
		case 503:
		case 504:
			return ErrorCodes.API_SERVER_ERROR;
		default:
			return status >= 500 ? ErrorCodes.API_SERVER_ERROR : ErrorCodes.NETWORK_UNKNOWN;
	}
}

/**
 * Check if HTTP status is retryable
 */
function isRetryableStatus(status?: number): boolean {
	if (!status) return true;
	// Retry server errors, rate limits, and request timeouts
	return status === 429 || status === 408 || status >= 500;
}

/**
 * Get default message for error code
 */
function getDefaultMessage(code: ErrorCode): string {
	const messages: Record<ErrorCode, string> = {
		[ErrorCodes.NETWORK_TIMEOUT]: 'Request timed out',
		[ErrorCodes.NETWORK_OFFLINE]: 'No internet connection',
		[ErrorCodes.NETWORK_UNKNOWN]: 'Network error',
		[ErrorCodes.API_NOT_FOUND]: 'Resource not found',
		[ErrorCodes.API_UNAUTHORIZED]: 'Unauthorized',
		[ErrorCodes.API_FORBIDDEN]: 'Access denied',
		[ErrorCodes.API_RATE_LIMITED]: 'Too many requests',
		[ErrorCodes.API_SERVER_ERROR]: 'Server error',
		[ErrorCodes.API_VALIDATION_ERROR]: 'Validation error',
		[ErrorCodes.CHAT_CONNECTION_FAILED]: 'Chat connection failed',
		[ErrorCodes.CHAT_MESSAGE_FAILED]: 'Failed to send message',
		[ErrorCodes.CHAT_TIMEOUT]: 'Chat request timed out',
		[ErrorCodes.AI_INFERENCE_ERROR]: 'AI processing error',
		[ErrorCodes.AI_RATE_LIMITED]: 'AI service rate limited',
		[ErrorCodes.FORM_VALIDATION_ERROR]: 'Form validation failed',
		[ErrorCodes.FORM_SUBMISSION_ERROR]: 'Form submission failed',
		[ErrorCodes.UNKNOWN_ERROR]: 'An error occurred',
		[ErrorCodes.INITIALIZATION_ERROR]: 'Initialization failed',
	};
	
	return messages[code] || 'An error occurred';
}

/**
 * Get default user-friendly message for error code
 */
function getDefaultUserMessage(code: ErrorCode): string {
	const messages: Record<ErrorCode, string> = {
		[ErrorCodes.NETWORK_TIMEOUT]: 'The request took too long. Please try again.',
		[ErrorCodes.NETWORK_OFFLINE]: 'You appear to be offline. Please check your connection.',
		[ErrorCodes.NETWORK_UNKNOWN]: 'A network error occurred. Please try again.',
		[ErrorCodes.API_NOT_FOUND]: 'The requested content was not found.',
		[ErrorCodes.API_UNAUTHORIZED]: 'Please sign in to continue.',
		[ErrorCodes.API_FORBIDDEN]: 'You don\'t have permission to access this.',
		[ErrorCodes.API_RATE_LIMITED]: 'Too many requests. Please wait a moment.',
		[ErrorCodes.API_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
		[ErrorCodes.API_VALIDATION_ERROR]: 'Please check your input and try again.',
		[ErrorCodes.CHAT_CONNECTION_FAILED]: 'Unable to connect to chat. Please try again.',
		[ErrorCodes.CHAT_MESSAGE_FAILED]: 'Message could not be sent. Please try again.',
		[ErrorCodes.CHAT_TIMEOUT]: 'The AI is taking longer than expected. Please try again.',
		[ErrorCodes.AI_INFERENCE_ERROR]: 'Unable to process your request. Please try again.',
		[ErrorCodes.AI_RATE_LIMITED]: 'Too many AI requests. Please wait a moment.',
		[ErrorCodes.FORM_VALIDATION_ERROR]: 'Please correct the errors in the form.',
		[ErrorCodes.FORM_SUBMISSION_ERROR]: 'Unable to submit form. Please try again.',
		[ErrorCodes.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
		[ErrorCodes.INITIALIZATION_ERROR]: 'Failed to initialize. Please refresh the page.',
	};
	
	return messages[code] || 'Something went wrong. Please try again.';
}

/**
 * Get chat-specific error message
 */
function getChatErrorMessage(code: ErrorCode): string {
	const messages: Record<string, string> = {
		[ErrorCodes.CHAT_CONNECTION_FAILED]: 'Unable to connect. The AI assistant is temporarily unavailable.',
		[ErrorCodes.CHAT_MESSAGE_FAILED]: 'Your message couldn\'t be sent. Please try again.',
		[ErrorCodes.CHAT_TIMEOUT]: 'The AI is thinking longer than usual. Please try a simpler question.',
		[ErrorCodes.AI_INFERENCE_ERROR]: 'I encountered an error processing your request. Please rephrase and try again.',
		[ErrorCodes.AI_RATE_LIMITED]: 'You\'ve reached the message limit. Please wait a moment before asking more questions.',
	};
	
	return messages[code] || getDefaultUserMessage(code);
}

// ─── Logging Utilities ────────────────────────────────────────────────────────

/**
 * Log error with structured data (for Sentry, etc.)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
	const appError = AppError.from(error);
	
	// In development, log to console
	if (process.env.NODE_ENV === 'development') {
		console.error('[AppError]', {
			code: appError.code,
			message: appError.message,
			details: appError.details,
			context,
			stack: appError.stack,
		});
	}
	
	// In production, could send to Sentry or other monitoring service
	// This is a placeholder for integration with monitoring services
}
