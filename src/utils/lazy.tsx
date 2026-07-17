/**
 * Lazy Loading Utilities
 * 
 * Utilities for lazy loading React components with proper error handling,
 * loading states, and retry logic.
 * 
 * @module utils/lazy
 */

import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LazyComponentOptions<P extends object> {
	/** Factory function that returns a module promise */
	factory: () => Promise<{ default: ComponentType<P> }>;
	/** Component to show while loading */
	fallback?: ReactNode;
	/** Minimum time to show loading state (prevents flash) */
	minimumDelay?: number;
	/** Name for error reporting */
	displayName?: string;
}

export interface RetryOptions {
	/** Maximum number of retry attempts */
	maxRetries?: number;
	/** Base delay between retries (ms) */
	baseDelay?: number;
	/** Whether to use exponential backoff */
	exponentialBackoff?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Add minimum delay to a promise to prevent flash of loading state
 */
async function withMinimumDelay<T>(promise: Promise<T>, minimumDelay: number): Promise<T> {
	const delayPromise = new Promise<void>((resolve) => setTimeout(resolve, minimumDelay));
	const [result] = await Promise.all([promise, delayPromise]);
	return result;
}

/**
 * Create a promise that retries on failure with exponential backoff
 */
async function withRetry<T>(
	factory: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const { maxRetries = 3, baseDelay = 1000, exponentialBackoff = true } = options;

	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await factory();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxRetries) {
				const delay = exponentialBackoff ? baseDelay * Math.pow(2, attempt) : baseDelay;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Create a lazy-loaded component with enhanced features
 * 
 * @example
 * ```tsx
 * const LazyChart = createLazyComponent({
 * factory: () => import('./Chart'),
 * fallback: <ChartSkeleton />,
 * minimumDelay: 200,
 * displayName: 'Chart'
 * });
 * 
 * // Usage
 * <LazyChart data={chartData} />
 * ```
 */
export function createLazyComponent<P extends object>(
	options: LazyComponentOptions<P>
): ComponentType<P> {
	const { factory, fallback = null, minimumDelay = 0, displayName } = options;

	// Create enhanced factory with minimum delay
	const enhancedFactory = () => {
		const promise = withRetry(factory);
		return minimumDelay > 0 ? withMinimumDelay(promise, minimumDelay) : promise;
	};

	// Create lazy component
	const LazyComponent = lazy(enhancedFactory);

	// Wrapper component with Suspense
	function LazyWrapper(props: P) {
		return (
			<Suspense fallback={fallback}>
				<LazyComponent {...props} />
			</Suspense>
		);
	}

	// Set display name for debugging
	LazyWrapper.displayName = displayName
		? `Lazy(${displayName})`
		: 'LazyComponent';

	return LazyWrapper;
}

// ─── Pre-built Lazy Components ────────────────────────────────────────────────

/**
 * Default loading skeleton for lazy components
 */
export function DefaultLoadingSkeleton(): ReactNode {
	return (
		<div
			className="animate-pulse bg-surface-subtle rounded"
			style={{ height: '200px', width: '100%' }}
			aria-label="Loading..."
			role="status"
		/>
	);
}

/**
 * Simple spinner for inline loading
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): ReactNode {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
	};

	return (
		<div
			className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-border border-t-accent`}
			role="status"
			aria-label="Loading..."
		/>
	);
}

// ─── Preload Utilities ────────────────────────────────────────────────────────

/**
 * Preload a component when it's likely to be needed soon
 * 
 * @example
 * ```tsx
 * // Preload on hover
 * <button onMouseEnter={() => preloadComponent(() => import('./Modal'))}>
 * Open Modal
 * </button>
 * ```
 */
export function preloadComponent<T>(factory: () => Promise<T>): void {
	// Start loading but don't wait for result
	factory().catch(() => {
		// Silently ignore preload errors
	});
}

/**
 * Create a preloadable lazy component
 * Returns both the component and a preload function
 */
export function createPreloadableLazyComponent<P extends object>(
	options: LazyComponentOptions<P>
): {
	Component: ComponentType<P>;
	preload: () => void;
} {
	const Component = createLazyComponent(options);
	const preload = () => preloadComponent(options.factory);

	return { Component, preload };
}
