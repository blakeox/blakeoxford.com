export function createModuleError(moduleName: string, code: string, message: string, meta?: Record<string, unknown>): Error {
	const err = new Error(`${moduleName}:${code} - ${message}`);
	try {
		(err as any).module = moduleName;
		(err as any).code = code;
		if (meta) (err as any).meta = meta;
	} catch (e) {
		// noop
	}
	return err;
}

export function handleError(err: unknown): void {
	// minimal stub for environments where AppError utils are not present during typecheck
	// In production, replace with real error handling
	// eslint-disable-next-line no-console
	console.error('AppError:', err);
}
