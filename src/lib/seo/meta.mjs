export function normalizeMetaText(value, maxLength) {
  const normalized = String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[—‑]/g, '-')
    .trim();

  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized
    .slice(0, maxLength - 1)
    .replace(/\s+\S*$/, '')
    .replace(/[,:;.!?\-]+$/, '')
    .trim();

  return `${clipped}…`;
}
