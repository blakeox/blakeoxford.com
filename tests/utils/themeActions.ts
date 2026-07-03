import { Page, expect } from '@playwright/test';
import { waitForTheme } from './waits';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export async function seedThemePreference(
	page: Page,
	preference: ThemePreference,
	options: { once?: boolean } = {},
): Promise<void> {
	const { once = true } = options;
	await page.addInitScript(({ pref, runOnce }) => {
		try {
			if (runOnce && sessionStorage.getItem('__theme_test_seeded')) return;
			localStorage.setItem('theme', pref);
			document.cookie = `theme=${encodeURIComponent(pref)}; Path=/; Max-Age=31536000; SameSite=Lax`;
			if (runOnce) sessionStorage.setItem('__theme_test_seeded', '1');
		} catch {
			/* ignore */
		}
	}, { pref: preference, runOnce: once });
}

export async function getThemePreference(page: Page): Promise<string | null> {
	return page.evaluate(() => document.documentElement.getAttribute('data-theme-preference'));
}

export async function getResolvedTheme(page: Page): Promise<string | null> {
	return page.evaluate(() => document.documentElement.getAttribute('data-theme'));
}

/** Cycle the navbar theme control until the resolved theme matches the target. */
export async function cycleThemeToResolved(page: Page, target: ResolvedTheme, maxClicks = 4): Promise<void> {
	const toggle = page.locator('#theme-toggle');
	await expect(toggle).toBeVisible();

	for (let i = 0; i < maxClicks; i += 1) {
		const current = await getResolvedTheme(page);
		if (current === target) return;
		await toggle.click();
		await waitForTheme(page, target, 5000).catch(() => undefined);
	}

	await expect.poll(async () => getResolvedTheme(page)).toBe(target);
}

/** Cycle until an explicit theme preference is set (not system). */
export async function cycleThemeToPreference(
	page: Page,
	target: Exclude<ThemePreference, 'system'>,
	maxClicks = 4,
): Promise<void> {
	const toggle = page.locator('#theme-toggle');
	await expect(toggle).toBeVisible();

	for (let i = 0; i < maxClicks; i += 1) {
		const current = await getThemePreference(page);
		if (current === target) return;
		await toggle.click();
		await waitForTheme(page, target, 5000).catch(() => undefined);
	}

	await expect.poll(async () => getThemePreference(page)).toBe(target);
}
