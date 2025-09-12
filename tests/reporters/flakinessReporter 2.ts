import { File, Reporter, Task } from 'vitest';
import fs from 'fs';
import path from 'path';

interface FlatTestRecord {
  id: string;
  file: string;
  name: string;
  fullName: string;
  status: string; // pass | fail | skip | todo | only | flaky (future)
  duration?: number;
  retry?: number;
  errors?: string[];
}

interface OutputShape {
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  todo: number;
  durationMs?: number;
  tests: FlatTestRecord[];
}

// Minimal custom reporter focused on deterministic machine-readable output.
export default class FlakinessReporter implements Reporter {
  private start = Date.now();
  private records: FlatTestRecord[] = [];

  onInit?(): void | Promise<void> { this.start = Date.now(); }

  onFinished(files?: File[]): void | Promise<void> {
    if (!files) return;
    for (const file of files) {
      const collect = (task: Task) => {
        if (task.type === 'test') {
          const anyTask: any = task as any;
          const result = anyTask.result || {};
            const baseStatus = (task as any).mode === 'skip' ? 'skip' : (task as any).mode === 'todo' ? 'todo' : (result.state || 'unknown');
            const retryCount = result.retryCount || 0;
            const status = (retryCount > 0 && baseStatus === 'pass') ? 'pass' : baseStatus; // keep pass but flag flaky separately
            this.records.push({
              id: task.id,
              file: file.filepath,
              name: task.name,
              fullName: (task as any).suite ? `${(task as any).suite.name} > ${task.name}` : task.name,
              status,
              duration: result.duration,
              retry: retryCount,
              errors: Array.isArray(result.errors) ? result.errors.map((e: any) => (e?.message || String(e))).slice(0,3) : undefined
            });
        }
        // child tasks (suites) – iterate if present
        if ((task as any).tasks) (task as any).tasks.forEach(collect);
      };
      (file.tasks || []).forEach(collect);
    }

    const passed = this.records.filter(r => r.status === 'pass').length;
    const failed = this.records.filter(r => r.status === 'fail').length;
    const skipped = this.records.filter(r => r.status === 'skip').length;
    const todo = this.records.filter(r => r.status === 'todo').length;

    const out: OutputShape = {
      generatedAt: new Date().toISOString(),
      total: this.records.length,
      passed, failed, skipped, todo,
      durationMs: Date.now() - this.start,
      tests: this.records,
    };

    const target = path.join(process.cwd(), 'test-results.json');
    try {
      fs.writeFileSync(target, JSON.stringify(out, null, 2));
      console.log(`\n[flakiness-reporter] Wrote ${this.records.length} test results to test-results.json`);
    } catch (err) {
      console.error('[flakiness-reporter] Failed to write test-results.json', err);
    }
  }
}
