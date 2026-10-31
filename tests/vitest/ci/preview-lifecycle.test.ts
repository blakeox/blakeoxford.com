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
import { stopRuntimePreview } from '../../../scripts/quality/run-runtime-metrics.js';

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

describe('runtime preview teardown', () => {
  const running = () => ({ pid: 45678, exitCode: null, signalCode: null });

  it('does not taskkill a Windows preview that already exited', async () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    await stopRuntimePreview({ ...running(), exitCode: 0 }, 'win32');
    expect(spawn).not.toHaveBeenCalled();
    expect(kill).not.toHaveBeenCalled();
  });

  it('tolerates a Windows process disappearing before taskkill completes', async () => {
    const command = new EventEmitter();
    spawn.mockImplementation(() => {
      queueMicrotask(() => command.emit('exit', 128));
      return command;
    });
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('Process already exited'), { code: 'ESRCH' });
    });

    await expect(stopRuntimePreview(running(), 'win32')).resolves.toBeUndefined();
    expect(spawn.mock.calls[0][0]).toBe('taskkill');
  });

  it('preserves Windows termination failures while the process is still alive', async () => {
    const command = new EventEmitter();
    spawn.mockImplementation(() => {
      queueMicrotask(() => command.emit('exit', 5));
      return command;
    });
    vi.spyOn(process, 'kill').mockReturnValue(true);

    await expect(stopRuntimePreview(running(), 'win32')).rejects.toThrow('taskkill exited 5');
  });

  it('terminates only the owned foreground process group on POSIX', async () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    await stopRuntimePreview(running(), 'linux');
    expect(kill).toHaveBeenCalledExactlyOnceWith(-45678, 'SIGTERM');
    expect(spawn).not.toHaveBeenCalled();
  });
});
