import { describe, expect, it } from 'vitest';
import { isProductionScheduledPath } from '../../../functions/index';

describe('production scheduled endpoint hardening', () => {
  it('blocks the local scheduled trigger endpoint in production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'production')).toBe(true);
  });

  it('does not block the path outside production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'development')).toBe(false);
    expect(isProductionScheduledPath('/healthz', 'production')).toBe(false);
  });
});
