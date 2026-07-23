/**
 * Brand-adjacent offline/500 HTML for the edge Worker.
 * Values mirror theme.css dark canvas + THEME_COLOR_LIGHT steel — no runtime CSS import.
 * Keep in sync with src/lib/theme.ts (THEME_COLOR_*) and src/styles/theme.css dark surfaces.
 */
export function buildOfflineHtml(reqId: string): string {
  const safeId = String(reqId || 'unknown').replace(/[<>&"']/g, '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#32618e"><title>Temporarily unavailable</title><style>body{font-family:'Source Sans 3','Space Grotesk',ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:oklch(0.14 0.02 255);color:oklch(0.97 0.005 95)}.card{background:oklch(0.18 0.02 255);border:1px solid oklch(0.97 0.005 95 / 0.12);border-radius:12px;padding:24px;max-width:560px;box-shadow:0 8px 32px oklch(0 0 0 / 0.35)}h1{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;font-size:20px;margin:0 0 8px}p{margin:0 0 12px;color:oklch(0.82 0.015 255)}a.btn{display:inline-block;background:oklch(0.48 0.09 250);color:oklch(0.98 0.005 95);font-weight:700;padding:8px 12px;border-radius:8px;text-decoration:none}.meta{margin-top:8px;font-size:12px;color:oklch(0.72 0.015 255)}a.link{color:oklch(0.7 0.08 250)}</style></head><body><div class="card"><h1>We're updating things</h1><p>Please try again in a moment. If this persists, contact me via <a class="link" href="https://www.linkedin.com/in/blakeoxford">LinkedIn</a>.</p><a class="btn" href="/">Go home</a><div class="meta">Correlation ID: ${safeId}</div></div></body></html>`;
}
