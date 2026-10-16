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
  return (
    block?.match(/^\x20{4}if: \|\n((?:\x20{6}.+\n)+)/m)?.[1] ??
    block?.match(/^\x20{4}if: \$\{\{ (.+) \}\}$/m)?.[1]
  );
};

const workflowContext = (actor: string, event_name: string, ref = 'refs/heads/main') => ({
  github: {
    actor,
    event_name,
    ref,
    repository: 'blakeox/blakeoxford.com',
    repository_owner: 'blakeox',
    event: { pull_request: { head: { repo: { full_name: 'external/fork' } } } },
  },
  vars: { USE_CUSTOM_CODEQL: 'true' },
  contains: (list: string[], value: string) => list.includes(value),
  fromJSON: JSON.parse,
});

describe('scheduled default-branch maintenance', () => {
  it.each([
    ['contrast-nightly', 'contrast'],
    ['contrast-maintenance', 'auto-close'],
    ['reliability-weekly', 'essential-reliability'],
    ['reliability-weekly', 'extended-reliability'],
    ['security', 'security-scan'],
    ['codeql', 'analyze'],
  ])('%s/%s runs independently of the stored schedule actor', (name, job) => {
    const condition = jobCondition(name, job);
    expect(condition).toBeDefined();
    for (const actor of ['blakeox', 'admin-collaborator', 'dependabot[bot]']) {
      expect(runInNewContext(condition!, workflowContext(actor, 'schedule'))).toBe(true);
    }
    if (name === 'codeql') {
      const context = workflowContext('admin-collaborator', 'schedule');
      context.vars.USE_CUSTOM_CODEQL = 'false';
      expect(runInNewContext(condition!, context)).toBe(false);
    }
  });
});

describe('documented local CI commands', () => {
  it.each([
    ['ci-comprehensive', 'comprehensive-tests'],
    ['ci-fast', 'quick-validation'],
    ['ci-fast', 'essential-e2e'],
    ['security', 'security-scan'],
  ])('%s/%s executes local act on its standard runner', (name, job) => {
    const context = workflowContext('nektos/act', 'push');
    const condition = jobCondition(name, job);
    expect(condition).toBeDefined();
    expect(runInNewContext(condition!, context)).toBe(true);
    const block = workflow(name)
      .split(`  ${job}:\n`)[1]
      ?.split(/\n\x20{2}[a-z0-9_-]+:\n/)[0];
    const runner = block?.match(/^\x20{4}runs-on: \$\{\{ (.+) \}\}$/m)?.[1];
    expect(runner).toBeDefined();
    expect(runInNewContext(runner!, context)).toEqual(['ubuntu-latest']);
    const path = workflow(name).match(/^\x20{2}PATH: \$\{\{ (.+) \}\}$/m)?.[1];
    expect(path).toBeDefined();
    expect(runInNewContext(path!, context)).not.toContain('/home/github-runner/');
  });
});

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
      ref = 'refs/heads/feature/ci-check',
      actor = 'blakeox'
    ) =>
      runInNewContext(expression, {
        github: { event_name, ref, actor },
        fromJSON: JSON.parse,
        contains: (list: string[], value: string) => list.includes(value),
      });
    for (const expression of expressions) {
      expect(evaluate(expression, 'pull_request')).toEqual(['ubuntu-latest']);
      if (['ci-fast', 'act-essential', 'act-local'].includes(name)) {
        expect(evaluate(expression, 'workflow_dispatch')).toEqual(['ubuntu-latest']);
        expect(evaluate(expression, 'push')).toEqual(['ubuntu-latest']);
      }
      if (['act-essential', 'act-local'].includes(name)) {
        expect(evaluate(expression, 'push', 'refs/heads/main', 'nektos/act')).toEqual([
          'ubuntu-latest',
        ]);
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
    const condition = jobCondition(name, job);
    expect(condition).toBeDefined();
    expect(runInNewContext(condition!, workflowContext('blakeox', 'workflow_dispatch'))).toBe(true);
    expect(
      runInNewContext(
        condition!,
        workflowContext('blakeox', 'workflow_dispatch', 'refs/heads/feature/untrusted')
      )
    ).toBe(false);
    expect(runInNewContext(condition!, workflowContext('collaborator', 'workflow_dispatch'))).toBe(
      false
    );
  });
});
