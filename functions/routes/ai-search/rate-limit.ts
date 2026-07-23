import type { Env } from '../../types';
import { isRateLimitBucket, type RateLimitResult } from './types';

export async function checkAiSearchRateLimit(
  env: Env,
  clientIp: string,
  sessionId: string | null
): Promise<RateLimitResult> {
  if (!env.RATE_LIMIT_KV) return { limited: false };

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  // Per-IP limit: 10 requests per minute
  const ipKey = `ratelimit:ai:ip:${clientIp}`;
  const ipData = await env.RATE_LIMIT_KV.get(ipKey, 'json');
  const ipCount = isRateLimitBucket(ipData) ? ipData : { count: 0, reset: now + windowMs };

  if (now > ipCount.reset) {
    ipCount.count = 0;
    ipCount.reset = now + windowMs;
  }

  ipCount.count++;
  await env.RATE_LIMIT_KV.put(ipKey, JSON.stringify(ipCount), { expirationTtl: 120 });

  if (ipCount.count > 10) {
    return { limited: true, reason: 'ip', resetIn: Math.ceil((ipCount.reset - now) / 1000) };
  }

  // Per-session limit: 30 requests per minute (more generous for legitimate users)
  if (sessionId) {
    const sessionKey = `ratelimit:ai:session:${sessionId}`;
    const sessionData = await env.RATE_LIMIT_KV.get(sessionKey, 'json');
    const sessionCount = isRateLimitBucket(sessionData)
      ? sessionData
      : { count: 0, reset: now + windowMs };

    if (now > sessionCount.reset) {
      sessionCount.count = 0;
      sessionCount.reset = now + windowMs;
    }

    sessionCount.count++;
    await env.RATE_LIMIT_KV.put(sessionKey, JSON.stringify(sessionCount), {
      expirationTtl: 120,
    });

    if (sessionCount.count > 30) {
      return {
        limited: true,
        reason: 'session',
        resetIn: Math.ceil((sessionCount.reset - now) / 1000),
      };
    }
  }

  return { limited: false };
}
