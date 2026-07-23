import type { ComponentDoc } from './types';
import { componentDocs } from './catalog';

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentDoc['category']): ComponentDoc[] {
  return componentDocs.filter((doc) => doc.category === category);
}

/**
 * Search components by name or tags
 */
export function searchComponents(query: string): ComponentDoc[] {
  const lowerQuery = query.toLowerCase();
  return componentDocs.filter((doc) => {
    const nameMatch = doc.name.toLowerCase().includes(lowerQuery);
    const descMatch = doc.description.toLowerCase().includes(lowerQuery);
    const tagMatch = doc.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
    return nameMatch || descMatch || tagMatch;
  });
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(componentDocs.map((doc) => doc.category)));
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = componentDocs.flatMap((doc) => doc.tags || []);
  return Array.from(new Set(tags)).sort();
}

/** Components linked to a Playwright visual baseline snapshot */
export function getComponentsWithVisualBaseline(): ComponentDoc[] {
  return componentDocs.filter((doc) => doc.visualBaseline);
}
