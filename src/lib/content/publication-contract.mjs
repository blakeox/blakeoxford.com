/**
 * Shared publication rules used by Astro route consumers and file-based indexers.
 * Keep this module dependency-free so prebuild scripts and the app use the same
 * draft and ordering semantics.
 */

export function isPublished(entry) {
  const draft = entry?.data?.draft ?? entry?.frontmatter?.draft;
  return Boolean(entry && !toBoolean(draft));
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return Boolean(value);
}

export function comparePublishedEntries(a, b) {
  const featuredDelta =
    Number(toBoolean(b.data?.featured ?? b.frontmatter?.featured)) -
    Number(toBoolean(a.data?.featured ?? a.frontmatter?.featured));
  if (featuredDelta !== 0) return featuredDelta;

  const dateA = new Date(
    a.data?.date ?? a.data?.pubDate ?? a.frontmatter?.date ?? a.frontmatter?.pubDate ?? 0
  ).getTime();
  const dateB = new Date(
    b.data?.date ?? b.data?.pubDate ?? b.frontmatter?.date ?? b.frontmatter?.pubDate ?? 0
  ).getTime();
  return dateB - dateA;
}

export function requireDescription(entry) {
  const description = String(
    entry.data?.description ?? entry.frontmatter?.description ?? ''
  ).trim();
  if (!description) {
    const id = entry.id ?? entry.slug ?? 'unknown-entry';
    throw new Error(`Published content entry ${id} is missing a description`);
  }
  return description;
}

export function requireAuthor(entry) {
  const author = String(entry.data?.author ?? entry.frontmatter?.author ?? '').trim();
  if (!author) {
    const id = entry.id ?? entry.slug ?? 'unknown-entry';
    throw new Error(`Published content entry ${id} is missing an author`);
  }
  return author;
}
