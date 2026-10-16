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
    ['dependabot[bot]', 'pull_request', 'blakeox/blakeoxford.com', true],
    ['dependabot[bot]', 'push', 'blakeox/blakeoxford.com', false],
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

const jobCondition = (name: string, job: string) => {
  const block = workflow(name)
    .split(`  ${job}:\n`)[1]
    ?.split(/\n\x20{2}[a-z0-9_-]+:\n/)[0];
  return block?.match(/^\x20{4}if: \|\n((?:\x20{6}.+\n)+)/m)?.[1];
};

describe('required PR checks include Dependabot', () => {
  it.each([
    ['ci-fast', 'quick-validation'],
    ['ci-fast', 'essential-e2e'],
    ['ci-fast', 'required-status-checks'],
    ['security', 'security-scan'],
    ['act-essential', 'essential-test'],
    ['act-local', 'local-test'],
    ['branch-flow-guard', 'guard'],
    ['pr-size-guard', 'pr-size-check'],
    ['deployment-status', 'deployment-gate'],
    ['deployment-status', 'syntax-check'],
    ['deployment-status', 'status-summary'],
  ])('%s/%s accepts same-repository Dependabot PRs only', (name, job) => {
    const condition = jobCondition(name, job);
    expect(condition).toBeDefined();
    const evaluableCondition = condition!
      .replaceAll('needs.quick-validation.result', "'success'")
      .replaceAll('needs.essential-e2e.result', "'success'")
      .replaceAll('needs.essential-e2e-crossbrowser.result', "'skipped'");
    const context = (actor: string, event_name: string, headRepository: string) => ({
      github: {
        actor,
        event_name,
        repository: 'blakeox/blakeoxford.com',
        repository_owner: 'blakeox',
        event: { pull_request: { head: { repo: { full_name: headRepository } } } },
      },
      needs: {
        'quick-validation': { result: 'success' },
        'essential-e2e': { result: 'success' },
        'essential-e2e-crossbrowser': { result: 'skipped' },
      },
      always: () => true,
      contains: (list: string[], value: string) => list.includes(value),
      fromJSON: JSON.parse,
    });
    expect(
      runInNewContext(
        evaluableCondition,
        context('dependabot[bot]', 'pull_request', 'blakeox/blakeoxford.com')
      )
    ).toBe(true);
    expect(
      runInNewContext(
        evaluableCondition,
        context('dependabot[bot]', 'push', 'blakeox/blakeoxford.com')
      )
    ).toBe(false);
    expect(
      runInNewContext(evaluableCondition, context('collaborator', 'pull_request', 'external/fork'))
    ).toBe(false);
  });
});

describe('pull request jobs stay off the deployment NUC', () => {
  it.each([
    ['ci-fast', 4],
    ['act-essential', 1],
    ['act-local', 1],
    ['security', 1],
    ['deployment-status', 3],
  ])('%s routes every mixed-event job to a fresh hosted runner for PRs', (name, expectedJobs) => {
    const expressions = [...workflow(name).matchAll(/^\x20{4}runs-on: \$\{\{ (.+) \}\}$/gm)].map(
      (match) => match[1]
    );
    expect(expressions).toHaveLength(expectedJobs);
    const evaluate = (
      expression: string,
      event_name: string,
      ref = 'refs/heads/feature/ci-check'
    ) =>
      runInNewContext(expression, {
        github: { event_name, ref },
        fromJSON: JSON.parse,
        contains: (list: string[], value: string) => list.includes(value),
      });
    for (const expression of expressions) {
      expect(evaluate(expression, 'pull_request')).toEqual(['ubuntu-latest']);
      if (['ci-fast', 'act-essential', 'act-local'].includes(name)) {
        expect(evaluate(expression, 'workflow_dispatch')).toEqual(['ubuntu-latest']);
        expect(evaluate(expression, 'push')).toEqual(['ubuntu-latest']);
      }
      for (const ref of ['refs/heads/main', 'refs/heads/development', 'refs/heads/testing']) {
        expect(evaluate(expression, 'push', ref)).toEqual(['self-hosted', 'nuc', 'seo']);
      }
    }
  });

  it.each([
    'auto-request-reviewers',
    'branch-flow-guard',
    'contrast-pr-comment',
    'design-token-docs-sync',
    'pr-labeler',
    'pr-size-guard',
  ])('%s uses hosted runners for PR events', (name) => {
    const runners = [...workflow(name).matchAll(/^\s+runs-on: (.+)$/gm)].map((match) => match[1]);
    expect(runners.length).toBeGreaterThan(0);
    expect(runners.every((runner) => runner === 'ubuntu-latest')).toBe(true);
  });

  it('sets up the supported Node runtime on the hosted token-docs job', () => {
    const source = workflow('design-token-docs-sync');
    expect(source).toContain('uses: actions/setup-node@v7');
    expect(source).toContain("node-version: '24'");
  });

  it.each([
    ['ci-comprehensive', 'comprehensive-tests'],
    ['reliability-weekly', 'essential-reliability'],
    ['reliability-weekly', 'extended-reliability'],
    ['contrast-nightly', 'contrast'],
    ['contrast-maintenance', 'auto-close'],
    ['codeql', 'analyze'],
    ['deploy-worker', 'deploy'],
  ])('%s/%s rejects manual refs outside main before checkout', (name, job) => {
    const block = workflow(name)
      .split(`  ${job}:\n`)[1]
      ?.split(/\n\x20{2}[a-z0-9_-]+:\n/)[0];
    expect(block).toContain("github.ref == 'refs/heads/main'");
    if (name !== 'deploy-worker') {
      expect(block).toContain("github.event_name != 'workflow_dispatch'");
    }
  });
});
