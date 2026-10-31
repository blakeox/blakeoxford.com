import { EventEmitter } from 'node:events';
import { get } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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

describe('POSIX preview descendants', () => {
  it('does not hide a process-group permission failure after the launcher exits', async () => {
    const denied = Object.assign(new Error('Group termination denied'), { code: 'EPERM' });
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw denied;
    });
    await expect(
      stopRuntimePreview({ pid: 45678, exitCode: 0, signalCode: null }, 'linux')
    ).rejects.toBe(denied);
    expect(kill).toHaveBeenCalledExactlyOnceWith(-45678, 'SIGTERM');
  });

  it.skipIf(process.platform === 'win32')(
    'stops a real descendant server after its launcher exits',
    async () => {
      const { spawn: realSpawn } =
        await vi.importActual<typeof import('node:child_process')>('child_process');
      const serverCode = `const server = require('node:http').createServer((req,res) => res.end('fixture'));
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({port: server.address().port})));`;
      const launcherCode = `const child = require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(serverCode)}], {stdio:['ignore','inherit','inherit']}); child.unref();`;
      const child = realSpawn(process.execPath, ['-e', launcherCode], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const ready = new Promise<number>((resolve, reject) => {
        let output = '';
        timer = setTimeout(() => reject(new Error('Descendant startup timed out')), 5000);
        child.stdout.on('data', (chunk) => {
          output += chunk.toString();
          if (output.includes('\n')) {
            clearTimeout(timer);
            resolve(JSON.parse(output.split('\n')[0]).port);
          }
        });
        child.once('error', reject);
      });
      const exited = new Promise<void>((resolve, reject) => {
        child.once('exit', (code) =>
          code === 0 ? resolve() : reject(new Error(`Launcher exited ${code}`))
        );
        child.once('error', reject);
      });
      const cleanup = () => {
        clearTimeout(timer);
        if (child.pid) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
          }
        }
        child.stdout.destroy();
        child.stderr.destroy();
      };
      try {
        const [port] = await Promise.all([ready, exited]);
        const url = `http://127.0.0.1:${port}/`;
        const status = () =>
          new Promise<number | undefined>((resolve, reject) => {
            const request = get(url, (response) => {
              response.resume();
              resolve(response.statusCode);
            });
            request.on('error', reject);
            request.setTimeout(1000, () => request.destroy(new Error('Fixture request timed out')));
          });
        expect(child.exitCode).toBe(0);
        expect(await status()).toBe(200);
        await stopRuntimePreview(child);
        await vi.waitFor(
          async () => {
            await expect(status()).rejects.toThrow();
          },
          { timeout: 3000, interval: 50 }
        );
      } finally {
        cleanup();
      }
    }
  );
});

describe('interrupted preview cleanup', () => {
  it.skipIf(process.platform === 'win32').each([
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ] as const)('stops its detached preview on %s before exiting', async (signal, expectedCode) => {
    const { spawn: realSpawn } =
      await vi.importActual<typeof import('node:child_process')>('child_process');
    const moduleUrl = pathToFileURL(resolve('scripts/quality/run-runtime-metrics.js')).href;
    const serverCode = `const server = require('node:http').createServer((req,res)=>res.end('fixture'));
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({port:server.address().port})));`;
    const taskCode = `const {spawn}=await import('node:child_process');
const {registerPreviewSignalHandlers}=await import(${JSON.stringify(moduleUrl)});
const preview=spawn(process.execPath,['-e',${JSON.stringify(serverCode)}],{detached:true,stdio:['ignore','pipe','inherit']});
console.log(JSON.stringify({pid:preview.pid}));
registerPreviewSignalHandlers(preview);
preview.stdout.on('data',chunk=>process.stdout.write(chunk));`;
    const task = realSpawn(process.execPath, ['--input-type=module', '-e', taskCode], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let previewPid: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Interrupt fixture timed out')), 5000);
    });
    const ready = new Promise<number>((resolve, reject) => {
      let output = '';
      task.stdout.on('data', (chunk) => {
        output += chunk.toString();
        let end;
        while ((end = output.indexOf('\n')) >= 0) {
          const item = JSON.parse(output.slice(0, end));
          output = output.slice(end + 1);
          if (item.pid) previewPid = item.pid;
          if (item.port) resolve(item.port);
        }
      });
      task.once('error', reject);
    });
    const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
      (resolve, reject) => {
        task.once('exit', (code, signal) => resolve({ code, signal }));
        task.once('error', reject);
      }
    );
    const cleanup = () => {
      clearTimeout(timer);
      if (task.exitCode === null && task.signalCode === null) task.kill('SIGKILL');
      if (previewPid) {
        try {
          process.kill(-previewPid, 'SIGKILL');
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        }
      }
      task.stdout.destroy();
      task.stderr.destroy();
    };
    try {
      const port = await Promise.race([ready, deadline]);
      const status = () =>
        new Promise<number | undefined>((resolve, reject) => {
          const req = get(`http://127.0.0.1:${port}/`, (res) => {
            res.resume();
            resolve(res.statusCode);
          });
          req.on('error', reject);
          req.setTimeout(1000, () => req.destroy(new Error('Fixture request timed out')));
        });
      expect(await status()).toBe(200);
      expect(task.kill(signal)).toBe(true);
      expect(await Promise.race([exited, deadline])).toEqual({ code: expectedCode, signal: null });
      await vi.waitFor(
        async () => {
          await expect(status()).rejects.toThrow();
        },
        { timeout: 3000, interval: 50 }
      );
    } finally {
      cleanup();
    }
  });
});
