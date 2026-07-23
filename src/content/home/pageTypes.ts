import type { CollectionEntry } from 'astro:content';

export type HomePageContent = CollectionEntry<'home'>['data'];
export type HomeCtaLink = HomePageContent['hero']['primaryCta'];
export type HomeResumeHighlightSide = HomePageContent['resumeHighlights']['sides'][number];
export type HomeResumeHighlightItem = HomeResumeHighlightSide['items'][number];
