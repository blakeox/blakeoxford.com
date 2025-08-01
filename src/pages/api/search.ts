// src/pages/api/search.ts
import type { APIRoute } from 'astro';
import Fuse from 'fuse.js';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const kv = locals.runtime.env.SEARCH_INDEX;
    const searchIndexString = await kv.get('search-index');

    if (!searchIndexString) {
      return new Response(JSON.stringify({ error: 'Search index not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const searchIndex = JSON.parse(searchIndexString);
    const fuse = new Fuse(searchIndex, {
      keys: ['title', 'description', 'tags'],
      includeScore: true,
      threshold: 0.4,
    });

    const results = fuse.search(query).slice(0, 20);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
