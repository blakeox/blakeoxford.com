import { getCollection } from 'astro:content';

export async function get() {
  const posts = await getCollection('blog');
  
  // Transform posts to match API contract
  const transformedPosts = posts.map(post => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    publishedAt: post.data.pubDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    tags: post.data.tags || [],
    author: post.data.author,
    featured: post.data.featured,
    draft: post.data.draft || false,
    excerpt: post.data.description // Use description as excerpt fallback
  }));
  
  return {
    body: JSON.stringify(transformedPosts),
  };
}
