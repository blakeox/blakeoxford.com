import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const workflow = (name: string) => readFileSync(`.github/workflows/${name}.yml`, 'utf8');

describe('deployment summary', () => {
  it.each([
    ['success', 'success', 0],
    ['skipped', 'success', 1],
    ['success', 'skipped', 1],
    ['skipped', 'skipped', 1],
    ['failure', 'success', 1],
    ['success', 'cancelled', 1],
  ])('reports readiness for %s / %s with exit %s', (deployment, syntax, exitCode) => {
    const script = workflow('deployment-status')
      .split('      - name: Report status\n        run: |\n')[1]
      .replace(/^ {10}/gm, '')
      .replace('${{ needs.deployment-gate.result }}', deployment)
      .replace('${{ needs.syntax-check.result }}', syntax);
    const result = spawnSync('bash', ['-e', '-c', script], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: '/dev/null' },
    });
    expect(result.status).toBe(exitCode);
    expect(result.stdout.includes('Ready for deployment!')).toBe(exitCode === 0);
  });
});

describe.each(['act-essential', 'act-local'])('%s actor gate', (name) => {
  it.each([
    ['nektos/act', 'push', 'blakeox/blakeoxford.com', true],
    ['blakeox', 'push', 'blakeox/blakeoxford.com', true],
    ['collaborator', 'push', 'blakeox/blakeoxford.com', false],
    ['collaborator', 'pull_request', 'blakeox/blakeoxford.com', true],
    ['collaborator', 'pull_request', 'external/fork', false],
    ['dependabot[bot]', 'pull_request', 'blakeox/blakeoxford.com', false],
  ])('handles %s on %s from %s', (actor, event, headRepository, allowed) => {
    const condition = workflow(name).match(/^ {4}if: \|\n((?: {6}.+\n)+)/m)?.[1];
    expect(condition).toBeDefined();
    const result = runInNewContext(condition!, {
      github: {
        actor,
        event_name: event,
        repository: 'blakeox/blakeoxford.com',
        repository_owner: 'blakeox',
        event: { pull_request: { head: { repo: { full_name: headRepository } } } },
      },
      contains: (list: string[], value: string) => list.includes(value),
      fromJSON: JSON.parse,
    });
    expect(result).toBe(allowed);
  });
});
