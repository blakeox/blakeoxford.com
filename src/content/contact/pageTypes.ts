import type { CollectionEntry } from 'astro:content';

export type ContactPageContent = CollectionEntry<'contact'>['data'];
/** Structurally matches `ContactChannels` in `@/components/features/contact/types`. */
export type ContactChannelsContent = ContactPageContent['channels'];
