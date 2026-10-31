/** Keep browser diagnostics aligned with the exact Workers Build and branch. */
export function resolveSentryBuildMetadata(env: Record<string, string | undefined>) {
  return {
    commit: env.WORKERS_CI_COMMIT_SHA || env.GIT_COMMIT || env.PUBLIC_GIT_COMMIT,
    environment:
      env.PUBLIC_SENTRY_ENVIRONMENT ||
      (env.WORKERS_CI_BRANCH
        ? env.WORKERS_CI_BRANCH === 'main'
          ? 'production'
          : 'preview'
        : undefined),
  };
}
