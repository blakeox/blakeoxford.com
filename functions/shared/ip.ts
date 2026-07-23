/** FNV-1a style fingerprint so Analytics Engine never stores raw client IPs. */
export function anonymizeClientIp(ip: string | null | undefined): string {
  if (!ip || ip === 'unknown') return 'unknown';
  let hash = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    hash ^= ip.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ip_${(hash >>> 0).toString(16)}`;
}
