import { getCollection } from 'astro:content';

export async function get() {
  const posts = await getCollection('blog');
  return {
    body: JSON.stringify(posts),
  };
}
