import type { CollectionEntry } from 'astro:content';

export type AboutPageContent = CollectionEntry<'about'>['data'];
export type AboutSocialLink = AboutPageContent['social']['links'][number];
export type AboutTimelineItem = AboutPageContent['timeline']['items'][number];
export type AboutAchievementCard = AboutPageContent['achievements']['cards'][number];
