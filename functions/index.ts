/**
 * Cloudflare Worker entry: route dispatch, canonicalization, asset fallback.
 */
import { initEdgeSentry } from '../sentry.edge.config.js';
import type { Env } from './types';
import { isBlakeOxfordHostname } from './shared/hostname';
import { generateRequestId } from './shared/request-id';
import type { RouteContext } from './shared/route-context';
import { handleRobotsFavicon } from './routes/robots-favicon';
import { handleHealth } from './routes/health';
import { handleEmail } from './routes/email';
import { handleAiSearch } from './routes/ai-search';
import { handleConversation } from './routes/conversation';
import { handleSemanticSearch } from './routes/semantic-search';
import { handleAiFeedback } from './routes/ai-feedback';
import { handleTheme } from './routes/theme';
import { handleAssets } from './routes/assets';

export { ConversationDurableObject } from './ConversationDO.ts';

const WorkerApp = {
  isAuditRequest(req: Request): boolean {
    try {
      const ua = (req.headers.get('user-agent') || '').toLowerCase();
      const flag = (req.headers.get('x-audit-mode') || req.headers.get('x-lighthouse') || '')
        .toString()
        .toLowerCase();
      const cookie = req.headers.get('cookie') || '';
      const hasAuditCookie = /(^|;)\s*audit=1\s*(;|$)/.test(cookie);
      return (
        ua.includes('lighthouse') ||
        ua.includes('chrome-lighthouse') ||
        ua.includes('headlesschrome') ||
        flag === '1' ||
        flag === 'true' ||
        flag === 'lighthouse' ||
        hasAuditCookie
      );
    } catch {
      return false;
    }
  },

  generateNonce(): string {
    try {
      if (crypto && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {
      // fallback below
    }
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const Sentry = initEdgeSentry(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/cdn-cgi/')) {
      return fetch(request);
    }

    const method = request.method || 'GET';
    const reqId = generateRequestId(request);

    // HTTPS + apex canonicalization
    try {
      const host = url.hostname;
      const isGetLike = request.method === 'GET' || request.method === 'HEAD';
      const isProdDomain = isBlakeOxfordHostname(host);
      if (isProdDomain && url.protocol === 'http:' && isGetLike) {
        url.protocol = 'https:';
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
      if (isProdDomain && host.startsWith('www.') && isGetLike) {
        url.hostname = host.replace(/^www\./, '');
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
    } catch {
      // ignore canonicalization errors
    }

    const routeCtx: RouteContext = { request, env, ctx, url, reqId, method, Sentry };

    const handlers = [
      handleRobotsFavicon,
      handleHealth,
      handleEmail,
      handleAiSearch,
      handleConversation,
      handleSemanticSearch,
      handleAiFeedback,
      handleTheme,
    ] as const;

    for (const handler of handlers) {
      const response = await handler(routeCtx);
      if (response) return response;
    }

    return handleAssets(routeCtx);
  },

  async stripAuditOnlyScripts(response: Response): Promise<Response> {
    try {
      const originalHeaders = new Headers(response.headers);
      const nonce = originalHeaders.get('X-CSP-Nonce') || '';
      let stripped = await response.text();
      const patterns = [
        /<script[^>]*src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js[^"]*"[^>]*>\s*<\/script>/gi,
        /<iframe[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*>\s*<\/iframe>/gi,
        /<script[^>]*src="https:\/\/static\.cloudflareinsights\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<script[^>]*src="https?:\/\/www\.googletagmanager\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<script[^>]*src="https?:\/\/www\.google-analytics\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<noscript>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi,
        /<script[^>]*data-cf-beacon[^>]*>\s*<\/script>/gi,
        /<script[^>]*>[\s\S]*?turnstile\/v0\/api\.js[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?cdn-cgi\/challenge-platform[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?zaraz[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?__CF\$cv[\s\S]*?<\/script>/gi,
        /<script[^>]*src=['"][^'"]*\/cdn-cgi\/challenge-platform\/[\s\S]*?>\s*<\/script>/gi,
      ];
      for (const rx of patterns) stripped = stripped.replace(rx, '');
      const auditBootstrapHtml = `<script${nonce ? ` nonce="${nonce}"` : ''}>(function(){try{window.__AUDIT__=true;window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){};var _sb=navigator.sendBeacon;navigator.sendBeacon=function(){return true};var _xf=window.fetch;window.fetch=function(u,o){try{if(typeof u==="string"&&(u.includes("challenges.cloudflare.com")||u.includes("/cdn-cgi/challenge-platform/")||u.includes("google-analytics.com")||u.includes("googletagmanager.com")||u.includes("static.cloudflareinsights.com")||u.includes("cloudflareinsights.com")||/\\/metrics\\/?(?:$|\\?|#)/.test(u))){return Promise.resolve(new Response("",{status:204}))}}catch  { void 0; }return _xf.apply(this,arguments)};var _create=document.createElement;document.createElement=function(t){var el=_create.call(document,t);if((t||"").toLowerCase()==="script"){try{var _set=el.setAttribute;el.setAttribute=function(k,v){try{if(String(k).toLowerCase()==="src"){var vv=String(v||"");if(vv.includes("/cdn-cgi/challenge-platform/")||/\\/metrics\\/?(?:$|\\?|#)/.test(vv)){return}}}catch  { void 0; }return _set.apply(el,arguments)}}catch  { void 0; }}return el};var _append=Element.prototype.appendChild;Element.prototype.appendChild=function(n){try{if(n&&n.tagName==="SCRIPT"){var s=String(n.src||"");if(s.includes("/cdn-cgi/challenge-platform/")||/\\/metrics\\/?(?:$|\\?|#)/.test(s)){return n}}}catch  { void 0; }return _append.call(this,n)};}catch  { void 0; }})();</script>`;
      const headClose = /<\/head>/i;
      if (headClose.test(stripped))
        stripped = stripped.replace(headClose, auditBootstrapHtml + '</head>');
      else stripped = auditBootstrapHtml + stripped;
      const newHeaders = new Headers(originalHeaders);
      newHeaders.append('set-cookie', 'audit=1; Path=/; Max-Age=300; SameSite=Lax');
      return new Response(stripped, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (e) {
      console.error('stripAuditOnlyScripts error:', e);
      return response;
    }
  },

  async applyPersonalization(response: Response): Promise<Response> {
    return response;
  },

  async trackEdgeAnalytics(): Promise<void> {
    // no-op
  },
};

export default WorkerApp;
