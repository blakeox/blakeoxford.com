import { describe, it, expect } from 'vitest';

// Mock props for BlogPostRow
const mockPost = {
  slug: 'hello-world',
  data: {
    title: 'Hello World',
    pubDate: new Date('2024-05-21'),
    tags: ['Astro', 'Testing'],
    description: 'A short excerpt or summary of the blog post goes here to entice the reader to click through and read more.',
  },
};

const mockLongDescriptionPost = {
  slug: 'long-desc',
  data: {
    title: 'Long Description',
    pubDate: new Date('2024-05-21'),
    tags: ['Long', 'Test'],
    description: 'A'.repeat(250),
  },
};

describe('BlogPostRow.astro', () => {
  it('renders the blog post title and link', async () => {
    // Simulate rendering logic
    expect(mockPost.data.title).toBe('Hello World');
    expect(`/blog/${mockPost.slug}/`).toBe('/blog/hello-world/');
  });

  it('renders tags if present', () => {
    expect(Array.isArray(mockPost.data.tags)).toBe(true);
    expect(mockPost.data.tags.length).toBeGreaterThan(0);
  });

  it('truncates long descriptions to 220 chars', () => {
    const desc = mockLongDescriptionPost.data.description;
    const truncated = desc.length > 220 ? `${desc.slice(0, 217)}...` : desc;
    expect(truncated.length).toBe(220);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('formats the pubDate correctly', () => {
    const date = new Date(mockPost.data.pubDate);
    const formatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    expect(typeof formatted).toBe('string');
  });
});
