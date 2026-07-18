// Utility functions for contrast history analytics (rolling averages, slope)
// Pure functions for easy unit testing.

/**
 * Compute simple moving average over the last N values (including the most recent).
 * If fewer than N values available, average over existing.
 * @param {number[]} values
 * @param {number} window
 * @returns {number|null} null if no values
 */
export function rollingAverage(values, window = 7) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const slice = values.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return +(sum / slice.length).toFixed(3);
}

/**
 * Compute simple slope (least squares) of y over x positions (1..n).
 * Returns null if <2 points. Slope rounded to 4 decimals.
 * @param {number[]} values
 * @returns {number|null}
 */
export function slope(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, y, i) => acc + y * xs[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  const m = (n * sumXY - sumX * sumY) / denom;
  return +m.toFixed(4);
}

/**
 * Convenience to compute both rolling avg & slope from an array of historical borderline counts.
 * @param {number[]} borderlineCounts
 * @param {number} window
 */
export function deriveMetrics(borderlineCounts, window = 7) {
  return {
    rollingAvg: rollingAverage(borderlineCounts, window),
    slope: slope(borderlineCounts),
  };
}

/**
 * Classify slope into qualitative buckets for alerting / badge arrows.
 * @param {number|null} m slope value
 * @param {number} neutralBand absolute slope <= neutralBand treated as flat
 * @returns {'improving'|'worsening'|'flat'|'n/a'}
 */
export function classifyTrend(m, neutralBand = 0.02) {
  if (m === null || Number.isNaN(m)) return 'n/a';
  if (Math.abs(m) <= neutralBand) return 'flat';
  return m > 0 ? 'worsening' : 'improving';
}

/**
 * Population standard deviation of last N values (window) or fewer if less available.
 * Returns null if <2 values.
 */
export function stdDev(values, window = 7) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const slice = values.slice(-window);
  if (slice.length < 2) return null;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
  return +Math.sqrt(variance).toFixed(3);
}
