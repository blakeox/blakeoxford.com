import { describe, it, expect } from 'vitest';
import {
  rollingAverage,
  slope,
  deriveMetrics,
  classifyTrend,
  stdDev,
} from '../../scripts/quality/lib/contrastMetrics.js';

describe('contrastMetrics', () => {
  it('rollingAverage handles fewer points than window', () => {
    expect(rollingAverage([2, 4], 7)).toBe(3);
  });
  it('rollingAverage computes correct average with window constraint', () => {
    expect(rollingAverage([1, 2, 3, 4, 10], 3)).toBeCloseTo((3 + 4 + 10) / 3, 3);
  });
  it('slope returns null for <2 values', () => {
    expect(slope([5])).toBeNull();
  });
  it('slope detects upward trend', () => {
    const v = [1, 2, 3, 4];
    expect(slope(v)).toBeGreaterThan(0);
  });
  it('deriveMetrics returns both fields', () => {
    const m = deriveMetrics([1, 2, 3]);
    expect(m.rollingAvg).not.toBeNull();
    expect(m.slope).not.toBeNull();
  });
  it('classifyTrend categorizes slopes', () => {
    expect(classifyTrend(0)).toBe('flat');
    expect(classifyTrend(0.001)).toBe('flat');
    expect(classifyTrend(0.2)).toBe('worsening');
    expect(classifyTrend(-0.2)).toBe('improving');
    expect(classifyTrend(null)).toBe('n/a');
  });
  it('stdDev returns null for <2 values', () => {
    expect(stdDev([5])).toBeNull();
  });
  it('stdDev computes expected population std dev', () => {
    const vals = [2, 4, 4, 4, 5, 5, 7, 9]; // mean=5, variance=4, stddev=2
    expect(stdDev(vals, 8)).toBe(2);
  });
});
