#!/usr/bin/env node
/**
 * Strips redundant dark: utilities from blog MDX and maps brand tokens to emphasis.
 *
 * Usage: node scripts/quality/blog-mdx-dark-codemod.js [--write]
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
const write = process.argv.includes('--write');

const REPLACEMENTS = [
	[/\btext-accent dark:text-accent-light\b/g, 'text-accent-emphasis'],
	[/\btext-primary dark:text-primary-light\b/g, 'text-primary-emphasis'],
	[/\btext-warning-dark dark:text-warning-light\b/g, 'text-warning-emphasis'],
	[/\btext-success-dark dark:text-success-light\b/g, 'text-success-emphasis'],
	[/\btext-foreground dark:text-foreground-light\b/g, 'text-foreground'],
	[/\btext-foreground\/90 dark:text-foreground-light\/90\b/g, 'text-foreground/90'],
	[/\btext-foreground\/85 dark:text-foreground-light\/85\b/g, 'text-foreground/85'],
	[/\btext-foreground\/70 dark:text-foreground-light\/70\b/g, 'text-foreground/70'],
	[/\bfrom-accent to-primary dark:from-accent-light dark:to-primary-light\b/g, 'from-accent-emphasis to-primary-emphasis'],
	[
		/\bfrom-accent via-primary to-accent dark:from-accent-light dark:via-primary-light dark:to-accent-light\b/g,
		'from-accent-emphasis via-primary-emphasis to-accent-emphasis',
	],
	[/\bfrom-primary to-accent dark:from-primary-light dark:to-accent-light\b/g, 'from-primary-emphasis to-accent-emphasis'],
	[/\bbg-white\/90 dark:bg-gray-900\/90\b/g, 'bg-surface/90'],
	[/\bbg-white\/80 dark:bg-gray-900\/80\b/g, 'bg-surface/80'],
	[/\bbg-white\/60 dark:bg-gray-900\/60\b/g, 'bg-surface/60'],
	[
		/\bfrom-white\/80 to-white\/60 dark:from-gray-900\/80 dark:to-gray-900\/60\b/g,
		'from-surface/80 to-surface/60',
	],
	[/\bbg-black\/10 dark:bg-white\/10\b/g, 'bg-foreground/10'],
	[/\bbg-black\/20 dark:bg-white\/10\b/g, 'bg-foreground/10'],
	[/\btext-red-600 dark:text-red-400\b/g, 'text-error-emphasis'],
	[/\btext-green-600 dark:text-green-400\b/g, 'text-success-emphasis'],
	[/\btext-yellow-600 dark:text-yellow-400\b/g, 'text-warning-emphasis'],
	[/\btext-blue-600 dark:text-blue-400\b/g, 'text-info-emphasis'],
	[/\btext-orange-600 dark:text-orange-400\b/g, 'text-warning-emphasis'],
	[/\btext-purple-600 dark:text-purple-400\b/g, 'text-accent-emphasis'],
	[/\btext-pink-600 dark:text-pink-400\b/g, 'text-accent-emphasis'],
	[/\btext-amber-600 dark:text-amber-400\b/g, 'text-warning-emphasis'],
	[/\btext-accent\/70 dark:text-accent-light\/70\b/g, 'text-accent-emphasis/70'],
	[/\btext-primary\/70 dark:text-primary-light\/70\b/g, 'text-primary-emphasis/70'],
	[/\bborder-gray-300 dark:border-gray-700\b/g, 'border-border'],
	[/\bborder-gray-300\/50 dark:border-gray-700\/50\b/g, 'border-border/50'],
	[/\bbg-white\/10 dark:bg-white\/5\b/g, 'bg-surface/10'],
	[
		/\bbg-gradient-to-r from-white\/20 to-white\/10 dark:from-white\/10 dark:to-white\/5\b/g,
		'bg-gradient-to-r from-surface/20 to-surface/10',
	],
	[
		/\bbg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800\b/g,
		'bg-gradient-to-br from-surface-subtle to-surface',
	],
	[
		/\bbg-gradient-to-br from-gray-100\/80 to-gray-200\/80 dark:from-gray-900\/80 dark:to-gray-800\/80\b/g,
		'bg-gradient-to-br from-surface-subtle/80 to-surface/80',
	],
	[
		/\bbg-gradient-to-r from-gray-100 via-accent\/10 to-gray-100 dark:from-gray-900 dark:to-gray-900\b/g,
		'bg-gradient-to-r from-surface-subtle via-accent/10 to-surface-subtle',
	],
	[/\bdark:border-green-400\/30\b/g, ''],
	[/\bdark:border-orange-400\/30\b/g, ''],
	[/\bdark:border-red-400\/40\b/g, ''],
	[
		/\bbg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white\b/g,
		'bg-gradient-to-br from-success to-success-dark text-on-dark',
	],
	[
		/\bbg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 text-white\b/g,
		'bg-gradient-to-br from-warning to-warning-dark text-on-dark',
	],
	[
		/\bbg-gradient-to-br from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 text-white\b/g,
		'bg-gradient-to-br from-error to-error-dark text-on-dark',
	],
	[
		/\bfrom-green-500\/10 to-emerald-500\/10 dark:from-green-400\/10 dark:to-emerald-400\/10\b/g,
		'from-success/10 to-success/10',
	],
	[
		/\bfrom-orange-500\/10 to-red-500\/10 dark:from-orange-400\/10 dark:to-red-400\/10\b/g,
		'from-warning/10 to-error/10',
	],
	[
		/\bfrom-white\/20 to-white\/10 dark:from-white\/15 dark:to-white\/5\b/g,
		'from-surface/20 to-surface/10',
	],
	[/\bdark:prose-invert\b/g, ''],
	[/\bdark:border-accent\/20\b/g, ''],
	[/\bdark:border-accent\/30\b/g, ''],
];

/** dark: utilities to drop when a semantic light token already covers dark mode */
const DARK_STRIP_RULES = [
	{ light: /\bbg-surface-subtle\b/, dark: /^dark:bg-surface-dark-subtle(?:\/[\d.]+)?$/ },
	{ light: /\bbg-surface(?:\/[\d.]+)?\b/, dark: /^dark:bg-surface-dark(?:\/[\d.]+)?$/ },
	{ light: /\btext-foreground(?:\/[\d.]+)?\b/, dark: /^dark:text-foreground-light(?:\/[\d.]+)?$/ },
	{ light: /\bfrom-primary\b/, dark: /^dark:from-primary-light$/ },
	{ light: /\bto-accent\b/, dark: /^dark:to-accent-light$/ },
	{ light: /\bfrom-accent\b/, dark: /^dark:from-accent-light$/ },
	{ light: /\bvia-primary\b/, dark: /^dark:via-primary-light$/ },
	{ light: /\bto-primary\b/, dark: /^dark:to-primary-light$/ },
];

function stripSemanticDarkPairs(tokens) {
	return tokens.filter((token) => {
		if (!token.startsWith('dark:')) return true;
		return !DARK_STRIP_RULES.some((rule) => {
			const hasLight = tokens.some((t) => !t.startsWith('dark:') && rule.light.test(t));
			return hasLight && rule.dark.test(token);
		});
	});
}

function stripRedundantDark(classValue) {
	const tokens = classValue.split(/\s+/).filter(Boolean);
	const deduped = stripSemanticDarkPairs(tokens);
	const lightTokens = new Set(deduped.filter((t) => !t.startsWith('dark:')));
	const filtered = deduped.filter((token) => {
		if (!token.startsWith('dark:')) return true;
		const lightEquivalent = token.slice(5);
		return !lightTokens.has(lightEquivalent);
	});
	let result = filtered.join(' ');
	for (const [pattern, replacement] of REPLACEMENTS) {
		result = result.replace(pattern, replacement);
	}
	return result.replace(/\s{2,}/g, ' ').trim();
}

function transformContent(content) {
	let next = content;
	for (const attr of ['className', 'class']) {
		const re = new RegExp(`${attr}="([^"]*)"`, 'g');
		next = next.replace(re, (match, classValue) => {
			const transformed = stripRedundantDark(classValue);
			if (!transformed) return '';
			if (transformed === classValue) return match;
			return `${attr}="${transformed}"`;
		});
	}
	return next;
}

function walkMdx(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) walkMdx(file).forEach((f) => files.push(f));
		else if (file.endsWith('.mdx')) files.push(file);
	}
	return files;
}

let totalBefore = 0;
let totalAfter = 0;

for (const file of walkMdx(blogDir)) {
	const before = fs.readFileSync(file, 'utf8');
	const darkBefore = (before.match(/\bdark:[a-z[\]/.%-]+/g) || []).length;
	const after = transformContent(before);
	const darkAfter = (after.match(/\bdark:[a-z[\]/.%-]+/g) || []).length;

	totalBefore += darkBefore;
	totalAfter += darkAfter;

	if (before !== after) {
		console.log(`${path.relative(root, file)}: ${darkBefore} → ${darkAfter} dark: utilities`);
		if (write) fs.writeFileSync(file, after);
	}
}

console.log(`[blog-mdx-dark-codemod] total dark: ${totalBefore} → ${totalAfter}${write ? ' (written)' : ' (dry run)'}`);
if (!write) {
	console.log('Re-run with --write to apply changes.');
}
