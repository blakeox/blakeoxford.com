/** True for apex and subdomains of blakeoxford.com (not spoofable suffix matches). */
export function isBlakeOxfordHostname(hostname: string): boolean {
  return hostname === 'blakeoxford.com' || hostname.endsWith('.blakeoxford.com');
}
