import { atlasMcp } from '../mcp/server.mjs';

const dataFiles = new Set([
  'regional-votes.json', 'regional-context.json', 'south-data.json',
  'context-data.json', 'results.csv', 'local/index.json',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/index.html' && (request.method === 'GET' || request.method === 'HEAD')) {
      url.pathname = '/argentina';
      return Response.redirect(url, 308);
    }
    if (url.pathname !== '/mcp' && url.pathname !== '/mcp/') return new Response('Not found', {status: 404});
    return atlasMcp(request, async (file, asText = false) => {
      // Permit only the known Atlas datasets, never an arbitrary URL or private object.
      if (!dataFiles.has(file) && !/^local\/(?:[1-9]|1[0-9]|2[0-4])\.json$/.test(file)) {
        throw new Error('Unknown Atlas dataset');
      }
      const data = await env.ASSETS.fetch(new Request(new URL('/'+file, url.origin)));
      if (!data.ok) throw new Error('Atlas asset unavailable');
      return asText ? data.text() : data.json();
    });
  },
};
