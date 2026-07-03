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
	[/\btext-foreground dark:text-foreground-light\b/g, 'text-foreground'],
	[/\btext-foreground\/90 dark:text-foreground-light\/90\b/g, 'text-foreground/90'],
	[/\btext-foreground\/70 dark:text-foreground-light\/70\b/g, 'text-foreground/70'],
	[/\bfrom-accent to-primary dark:from-accent-light dark:to-primary-light\b/g, 'from-accent-emphasis to-primary-emphasis'],
	[/\bfrom-accent via-primary to-accent dark:from-accent-light dark:via-primary-light dark:to-accent-light\b/g, 'from-accent-emphasis via-primary-emphasis to-accent-emphasis'],
	[/\bbg-white\/90 dark:bg-gray-900\/90\b/g, 'bg-surface/90'],
	[/\bdark:prose-invert\b/g, ''],
	[/\bdark:border-accent\/20\b/g, ''],
	[/\bdark:border-accent\/30\b/g, ''],
];

function stripRedundantDark(classValue) {
	const tokens = classValue.split(/\s+/).filter(Boolean);
	const lightTokens = new Set(tokens.filter((t) => !t.startsWith('dark:')));
	const filtered = tokens.filter((token) => {
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
	return content.replace(/className="([^"]*)"/g, (match, classValue) => {
		const next = stripRedundantDark(classValue);
		return next ? `className="${next}"` : match.replace(classValue, '').replace('className=""', '');
	});
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
