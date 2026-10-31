import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn, default: { ...actual, spawn } };
});
vi.mock('lighthouse', () => ({ default: vi.fn() }));
vi.mock('chrome-launcher', () => ({ launch: vi.fn() }));
import PerformanceTestRunner from '../../../scripts/build/performance-test.js';

afterEach(() => {
  vi.restoreAllMocks();
  spawn.mockReset();
});

describe('performance preview lifecycle', () => {
  function runner() {
    const instance = new PerformanceTestRunner();
    instance.isExternalServer = false;
    vi.spyOn(instance, 'findAvailablePort').mockResolvedValue(4327);
    return instance;
  }

  it('uses the installed foreground preview at the selected loopback port', async () => {
    const child = Object.assign(new EventEmitter(), { pid: 45678, unref: vi.fn() });
    spawn.mockReturnValue(child);
    const instance = runner();
    vi.spyOn(instance, 'waitForServer').mockResolvedValue(true);

    await instance.startDevServer();

    expect(instance.baseUrl).toBe('http://127.0.0.1:4327');
    expect(spawn).toHaveBeenCalledOnce();
    expect(spawn.mock.calls[0][1]).toEqual([
      'pnpm',
      'preview',
      '--ignore-lock',
      '--host',
      '127.0.0.1',
      '--port',
      '4327',
    ]);
  });

  it('cleans up and propagates failed startup without fetching a fallback package', async () => {
    spawn.mockReturnValue({ pid: 45678, unref: vi.fn() });
    const instance = runner();
    const failure = new Error('Preview did not become ready');
    vi.spyOn(instance, 'waitForServer').mockRejectedValue(failure);
    const stop = vi.spyOn(instance, 'stopDevServer').mockResolvedValue(undefined);

    await expect(instance.startDevServer()).rejects.toBe(failure);

    expect(stop).toHaveBeenCalledOnce();
    expect(spawn).toHaveBeenCalledOnce();
  });

  it('fails before spawning when no preview port is available', async () => {
    const instance = runner();
    vi.mocked(instance.findAvailablePort).mockResolvedValue(null);

    await expect(instance.startDevServer()).rejects.toThrow('No free preview port');
    expect(spawn).not.toHaveBeenCalled();
  });
});
