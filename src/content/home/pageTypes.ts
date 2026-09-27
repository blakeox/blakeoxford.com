import type { CollectionEntry } from 'astro:content';

export type HomePageContent = CollectionEntry<'home'>['data'];
export type HomeCtaLink = HomePageContent['hero']['primaryCta'];
