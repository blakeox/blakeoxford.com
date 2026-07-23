/** Prefer Cloudflare / client request id headers; otherwise generate a short hex id. */
export function generateRequestId(request: Request): string {
  try {
    const h = request.headers.get('cf-request-id') || request.headers.get('x-request-id');
    if (h) return h;
  } catch {
    /* no-op */
  }
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}
