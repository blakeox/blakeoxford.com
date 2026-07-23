import { getEntry } from 'astro:content';
import type { ContactPageContent } from './pageTypes';

export async function getContactPage(): Promise<ContactPageContent> {
  const entry = await getEntry('contact', 'page');
  if (!entry) {
    throw new Error('Contact page content not found at src/content/contact/page.json');
  }
  return entry.data;
}
