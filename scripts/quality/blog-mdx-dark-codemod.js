#!/usr/bin/env node
/**
 * Strips redundant dark: utilities from blog MDX and maps raw grays to semantic tokens.
 * Run: node scripts/quality/blog-mdx-dark-codemod.js [--write]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const DRY = !process.argv.includes('--write');

/** Pairs applied in order — earlier rules run first. */
const REPLACEMENTS = [
	[/ dark:from-accent\/10 dark:via-primary\/5 dark:to-accent\/10/g, ''],
	[/ dark:from-accent\/10 dark:via-primary\/10 dark:to-accent\/10/g, ''],
	[/ dark:from-accent\/5 dark:via-primary\/5 dark:to-accent\/5/g, ''],
	[/ dark:from-accent\/5 dark:via-primary\/10 dark:to-accent\/5/g, ''],
	[/ dark:from-red-500\/10 dark:to-rose-500\/5/g, ''],
	[/ dark:from-green-500\/10 dark:to-emerald-500\/5/g, ''],
	[/ dark:from-red-500\/5 dark:to-rose-500\/5/g, ''],
	[/ dark:from-green-500\/5 dark:to-emerald-500\/5/g, ''],
	[/ dark:from-accent\/5 dark:to-primary\/5/g, ''],
	[/ dark:from-primary\/5 dark:to-accent\/5/g, ''],
	[/ dark:from-purple-500\/5 dark:to-violet-500\/5/g, ''],
	[/ dark:from-orange-500\/10 dark:to-red-500\/10/g, ''],
	[/ dark:from-orange-400\/10 dark:to-red-400\/10/g, ''],
	[/ dark:from-green-500\/10 dark:to-emerald-500\/10/g, ''],
	[/ dark:from-green-400\/10 dark:to-emerald-400\/10/g, ''],
	[/ dark:border-accent\/20/g, ''],
	[/ dark:border-accent\/30/g, ''],
	[/ dark:border-green-500\/30/g, ''],
	[/ dark:border-orange-500\/30/g, ''],
	[/bg-white\/90 dark:bg-gray-900\/90/g, 'bg-surface/90'],
	[/ dark:prose-invert/g, ''],
	[/text-foreground\/85 dark:text-foreground-light\/85/g, 'text-foreground/85'],
	[/text-foreground\/90 dark:text-foreground-light\/90/g, 'text-foreground/90'],
	[/text-foreground\/70 dark:text-foreground-light\/70/g, 'text-foreground/70'],
	[/text-foreground dark:text-foreground-light/g, 'text-foreground'],
	[/ dark:bg-surface-dark\/50/g, ''],
	[/ dark:bg-surface-dark-subtle/g, ''],
	[/ dark:text-foreground-light\/70/g, ''],
	[/ dark:text-foreground-light\/85/g, ''],
	[/ ring-border\/30 dark:bg-surface-dark-subtle dark:text-foreground-light\/70/g, ' ring-border/30'],
];

let stats = { files: 0, replacements: 0 };

for (const entry of fs.readdirSync(BLOG_DIR)) {
	if (!entry.endsWith('.mdx')) continue;
	const file = path.join(BLOG_DIR, entry);
	let content = fs.readFileSync(file, 'utf8');
	const original = content;

	for (const [pattern, replacement] of REPLACEMENTS) {
		const matches = content.match(pattern);
		if (matches) {
			stats.replacements += matches.length;
			content = content.replace(pattern, replacement);
		}
	}

	if (content !== original) {
		stats.files++;
		if (DRY) {
			console.log(`[dry-run] would update ${entry}`);
		} else {
			fs.writeFileSync(file, content, 'utf8');
			console.log(`[write] updated ${entry}`);
		}
	}
}

console.log(
	`Blog MDX codemod: ${stats.files} file(s), ${stats.replacements} replacement(s), mode=${DRY ? 'DRY' : 'WRITE'}`,
);
