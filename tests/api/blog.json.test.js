import { describe, it, expect, vi, beforeAll } from 'vitest';
import { get } from '../../src/pages/api/blog.json.js';

// Mock the getCollection function
vi.mock('astro:content');

describe('blog.json API endpoint', () => {
  it('returns all blog posts', async () => {
    // Call the API endpoint
    const response = await get();
    
    // Parse the returned JSON body
    const posts = JSON.parse(response.body);
    
    // Verify the structure and content of the response
    expect(posts).toBeInstanceOf(Array);
    expect(posts).toHaveLength(2);
    
    // Check the first post has the right structure
    const firstPost = posts[0];
    expect(firstPost).toHaveProperty('slug', 'hello-world');
    expect(firstPost).toHaveProperty('body');
    expect(firstPost).toHaveProperty('data');
    expect(firstPost.data).toHaveProperty('title', 'Hello World');
    expect(firstPost.data).toHaveProperty('description', 'My first post');
    
    // Check the second post
    const secondPost = posts[1];
    expect(secondPost).toHaveProperty('slug', 'second-post');
    expect(secondPost.data).toHaveProperty('title', 'Second Post');
  });
});
