/**
 * LocalStorage utilities with safe error handling
 * Provides type-safe storage operations for chat functionality
 */

/**
 * Safely get and parse JSON from localStorage
 * @param key - Storage key
 * @param fallback - Default value if not found or invalid
 * @returns Parsed value or fallback
 */
export function getStorageItem<T>(key: string, fallback: T): T {
	if (typeof window === 'undefined') return fallback;
	
	try {
		const stored = window.localStorage.getItem(key);
		if (!stored) return fallback;
		
		const parsed = JSON.parse(stored);
		return parsed ?? fallback;
	} catch {
		// Silently handle parse errors
		return fallback;
	}
}

/**
 * Safely set JSON value in localStorage
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success boolean
 */
export function setStorageItem<T>(key: string, value: T): boolean {
	if (typeof window === 'undefined') return false;
	
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		// Silently handle storage errors
		return false;
	}
}

/**
 * Safely remove item from localStorage
 * @param key - Storage key
 * @returns Success boolean
 */
export function removeStorageItem(key: string): boolean {
	if (typeof window === 'undefined') return false;
	
	try {
		window.localStorage.removeItem(key);
		return true;
	} catch {
		// Silently handle removal errors
		return false;
	}
}

/**
 * Get boolean preference from storage
 * @param key - Storage key
 * @param preferenceKey - Key within the stored object
 * @param fallback - Default value
 * @returns Boolean preference or fallback
 */
export function getBooleanPreference(
	key: string,
	preferenceKey: string,
	fallback: boolean
): boolean {
	const stored = getStorageItem<Record<string, unknown>>(key, {});
	
	if (stored && typeof stored[preferenceKey] === 'boolean') {
		return stored[preferenceKey] as boolean;
	}
	
	return fallback;
}
