export function createModuleError(message: string): Error {
	return new Error(message);
}

export function handleError(err: unknown): void {
	// minimal stub for environments where AppError utils are not present during typecheck
	// In production, replace with real error handling
	console.error('AppError:', err);
}
