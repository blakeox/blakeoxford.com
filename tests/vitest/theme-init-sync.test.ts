import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
	THEME_STORAGE_KEY,
	THEME_COOKIE_MAX_AGE,
	THEME_ATTRIBUTE,
	THEME_PREFERENCE_ATTRIBUTE,
	DARK_CLASS,
} from '../../src/lib/theme';

const themeInitPath = path.join(process.cwd(), 'src/components/islands/ThemeInitIsland.tsx');
const initSource = fs.readFileSync(themeInitPath, 'utf8');

function extractInitScript(): string {
	const match = initSource.match(/const INIT_SCRIPT = `([\s\S]*?)`;/);
	if (!match?.[1]) throw new Error('INIT_SCRIPT block not found in ThemeInitIsland.tsx');
	return match[1]
		.replaceAll('${THEME_STORAGE_KEY}', THEME_STORAGE_KEY)
		.replaceAll('${THEME_ATTRIBUTE}', THEME_ATTRIBUTE)
		.replaceAll('${THEME_PREFERENCE_ATTRIBUTE}', THEME_PREFERENCE_ATTRIBUTE)
		.replaceAll('${DARK_CLASS}', DARK_CLASS)
		.replaceAll('${THEME_COOKIE_MAX_AGE}', String(THEME_COOKIE_MAX_AGE));
}

describe('ThemeInitIsland sync with theme.ts', () => {
	const initScript = extractInitScript();

	it('imports theme constants from the shared module', () => {
		expect(initSource).toContain('../../lib/theme');
		expect(initSource).toContain('THEME_STORAGE_KEY');
		expect(initSource).toContain('THEME_ATTRIBUTE');
		expect(initSource).toContain('THEME_PREFERENCE_ATTRIBUTE');
		expect(initSource).toContain('DARK_CLASS');
		expect(initSource).toContain('THEME_COOKIE_MAX_AGE');
	});

	it('supports light, dark, and system preferences', () => {
		expect(initScript).toContain('light');
		expect(initScript).toContain('dark');
		expect(initScript).toContain('system');
		expect(initScript).toContain('prefers-color-scheme: dark');
	});

	it('sets data-theme, class, and colorScheme on first paint', () => {
		expect(initScript).toContain(`root.setAttribute('${THEME_ATTRIBUTE}'`);
		expect(initScript).toContain(`root.classList.add('${DARK_CLASS}')`);
		expect(initScript).toContain('root.style.colorScheme = theme');
	});

	it('only persists when preference is explicit', () => {
		expect(initScript).toContain('if (explicit)');
		expect(initScript).toContain('localStorage.setItem(key, preference)');
	});
});
