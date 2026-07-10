import { getEntry } from 'astro:content';
import type { AboutPageContent } from './pageTypes';

export async function getAboutPage(): Promise<AboutPageContent> {
  const entry = await getEntry('about', 'page');
  if (!entry) {
    throw new Error('About page content not found at src/content/about/page.json');
  }
  return entry.data as AboutPageContent;
}
