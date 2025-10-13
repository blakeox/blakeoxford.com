/**
 * Async Utility Tests
 * Comprehensive tests for async helper functions
 */
import { describe, it, expect, vi } from 'vitest';
import { sleep, retry, debounce, throttle } from '../../../src/utils/index';

describe('Async Utilities', () => {
  describe('sleep', () => {
    it('resolves after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow small margin
    });

    it('returns Promise that resolves to undefined', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });

  describe('retry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure up to max attempts', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await retry(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws last error after all retries fail', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));
      
      await expect(retry(fn, 3, 10)).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff between retries', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue('success');
      
      const start = Date.now();
      await retry(fn, 3, 100);
      const duration = Date.now() - start;
      
      // Should wait ~100ms on first retry (exponential backoff)
      expect(duration).toBeGreaterThanOrEqual(90);
    });
  });

  describe('debounce', () => {
    it('delays function execution', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    it('cancels previous calls within delay window', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      vi.advanceTimersByTime(50);
      debounced(); // Should cancel first call
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('limits function execution rate', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
      
      throttled(); // Should be ignored
      throttled(); // Should be ignored
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });
});
