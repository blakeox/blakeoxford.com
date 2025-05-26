import { describe, it, expect } from 'vitest';
import { collections } from '../src/content/config';

const { blog, projects } = collections;

describe('Blog frontmatter schema', () => {
  const validBlog = {
    title: 'My First Post',
    description: 'A short description',
    pubDate: new Date(),
    author: 'Author Name',
    tags: ['tag1', 'tag2'],
    draft: false,
  };

  it('parses valid blog frontmatter', () => {
    const parsed = blog.schema.parse(validBlog);
    expect(parsed).toMatchObject(validBlog);
  });

  it('throws on missing required fields', () => {
    const invalid = { description: 'Missing title and pubDate' } as unknown;
    expect(() => blog.schema.parse(invalid as any)).toThrow();
  });

  it('throws on invalid types', () => {
    const invalidType = { ...(validBlog as any), pubDate: 'not-a-date' };
    expect(() => blog.schema.parse(invalidType as any)).toThrow();
  });
});

describe('Projects frontmatter schema', () => {
  const validProject = {
    title: 'Project X',
    date: new Date(),
    image: '/img/project.png',
    tags: ['alpha'],
    link: 'https://example.com',
    draft: true,
  };

  it('parses valid project frontmatter', () => {
    const parsed = projects.schema.parse(validProject);
    expect(parsed).toMatchObject(validProject);
  });

  it('throws on missing date field', () => {
    const { date, ...withoutDate } = validProject;
    expect(() => projects.schema.parse(withoutDate as any)).toThrow();
  });

  it('throws on invalid link type', () => {
    const invalidLink = { ...(validProject as any), link: 123 };
    expect(() => projects.schema.parse(invalidLink as any)).toThrow();
  });
});
