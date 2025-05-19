import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({ params: { slug: post.slug } }));
}

export async function get({ params }) {
  const { slug } = params;
  const posts = await getCollection('blog');
  const post = posts.find(p => p.slug === slug);
  return {
    body: JSON.stringify(post),
  };
}
