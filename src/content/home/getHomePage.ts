import { getEntry } from 'astro:content';
import type { HomePageContent } from './pageTypes';

export async function getHomePage(): Promise<HomePageContent> {
  const entry = await getEntry('home', 'page');
  if (!entry) {
    throw new Error('Home page content not found at src/content/home/page.json');
  }
  return entry.data as HomePageContent;
}
