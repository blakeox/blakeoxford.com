import { describe, expect, it } from 'vitest';
import { resolveSentryBuildMetadata } from '../../src/lib/sentry-build';

describe('Sentry build identity', () => {
  it('uses the deployed revision instead of a stale public placeholder', () => {
    expect(
      resolveSentryBuildMetadata({
        WORKERS_CI_COMMIT_SHA: 'deployed-revision',
        GIT_COMMIT: 'older-revision',
        PUBLIC_GIT_COMMIT: 'dev',
        WORKERS_CI_BRANCH: 'main',
      })
    ).toEqual({ commit: 'deployed-revision', environment: 'production' });
  });

  it.each(['development', 'testing', 'feature/sentry-project-wiring'])(
    'keeps %s diagnostics out of the production environment',
    (branch) => {
      expect(resolveSentryBuildMetadata({ WORKERS_CI_BRANCH: branch }).environment).toBe('preview');
    }
  );

  it('supports manual build revisions and an isolated verification environment', () => {
    expect(
      resolveSentryBuildMetadata({
        GIT_COMMIT: 'manual-revision',
        PUBLIC_SENTRY_ENVIRONMENT: 'verification',
      })
    ).toEqual({ commit: 'manual-revision', environment: 'verification' });
  });

  it('preserves standalone public revisions and the existing local mode fallback', () => {
    expect(resolveSentryBuildMetadata({ PUBLIC_GIT_COMMIT: 'local-revision' })).toEqual({
      commit: 'local-revision',
      environment: undefined,
    });
    expect(resolveSentryBuildMetadata({})).toEqual({ commit: undefined, environment: undefined });
  });
});
