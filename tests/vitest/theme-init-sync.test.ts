import { describe, it, expect } from 'vitest';
import {
	THEME_STORAGE_KEY,
	THEME_COOKIE_MAX_AGE,
	THEME_ATTRIBUTE,
	THEME_PREFERENCE_ATTRIBUTE,
	DARK_CLASS,
	getThemeFoucPreventionScript,
} from '../../src/lib/theme';

describe('getThemeFoucPreventionScript', () => {
	const initScript = getThemeFoucPreventionScript();

	it('embeds shared theme constants', () => {
		expect(initScript).toContain(THEME_STORAGE_KEY);
		expect(initScript).toContain(THEME_ATTRIBUTE);
		expect(initScript).toContain(THEME_PREFERENCE_ATTRIBUTE);
		expect(initScript).toContain(DARK_CLASS);
		expect(initScript).toContain(String(THEME_COOKIE_MAX_AGE));
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
