# Cloudflare Operations Runbook

This runbook is the low-maintenance operating contract for the production
Worker `blakeoxford-com`. It uses Cloudflare Synthetic Monitoring, Cloudflare
native observability, Sentry, and the local smoke script. No additional
monitoring vendor or secret is required.

Browser measurement and vendor activation are documented separately in
[`analytics.md`](./analytics.md); this runbook owns edge, Worker, and AI
operational signals.

Production Ask calls AI Search instance `bold-heart-18e4` through the
`AI_SEARCH` Workers binding. The public `/api/ai-search` response and SSE
contract are unchanged. `AI_SEARCH_API_ENDPOINT` remains only so the previous
Worker version can still reach that instance. Roll back by deploying the
previous Worker version. Do not point the endpoint at the retired AutoRAG API.

An every-six-hours Cron Trigger runs a fixed, timestamped AI Search canary. It
records only success/error, latency, and response length in Analytics Engine;
it does not include user prompts or response text.

Cloudflare Health Checks are intentionally not configured: the current
`blakeoxford.com` zone is on the Free plan, and the dashboard requires Pro /
Smart Shield for that feature. Do not upgrade billing or weaken existing
protections to create a duplicate check. The approved Free-plan availability
signal is the weekly Synthetic Monitoring test plus the local edge smoke
script; an email alert for Health Check status changes does not currently
exist.

## Signals and owners

| Signal            | Leading indicator                           | Action threshold                                           | Owner                 |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------- | --------------------- |
| Edge availability | Cloudflare weekly Synthetic Monitoring test | Any failed test or missing result                          | Repository maintainer |
| Worker failures   | Workers Logs / Traces and Sentry            | Any sustained error burst or repeated exception            | Repository maintainer |
| API abuse         | Cloudflare WAF/rate-limit events            | Repeated hits on `API burst protection` or customer impact | Repository maintainer |
| API contract      | CORS/debug/header smoke checks              | Any failed smoke check                                     | Repository maintainer |
| Secret health     | Secret review checklist below               | Unknown age, suspected exposure, or failed integration     | Repository maintainer |

The lagging availability indicator is the percentage of Cloudflare Synthetic
Monitoring tests that pass. The target is 100%; any failure is investigated
before it is treated as noise. The GitHub-hosted curl monitor was retired after
Cloudflare Bot Fight Mode correctly issued managed challenges to shared GitHub
runner IPs. Do not weaken Bot Fight Mode or add a broad runner allowlist to
restore it.

## Routine checks

### After each production deployment

1. Confirm the Workers Build completed successfully for the deployed `main`
   SHA.
2. Run `pnpm monitor:edge` from a trusted local environment.
3. Check `/_healthz`, the homepage, CORS rejection, and the blocked debug route.
4. Confirm the Cloudflare Synthetic Monitoring one-time test for the homepage
   completes successfully.
5. Review Workers Logs/Traces and Sentry for exceptions from the new release.
6. Record the deployment SHA and Worker version in the release handoff.
7. Confirm `pnpm ai-search:refresh` ran after the deploy. That syncs
   `bold-heart-18e4`, waits for the indexing job to finish, then purges the
   similarity cache and deletes production `ai:response:v4:` KV answers so the
   seven-day app cache does not keep the previous content.
   Workers Builds is the primary deploy path. Its production deploy command is
   `pnpm deploy:worker --var "GIT_COMMIT:$WORKERS_CI_COMMIT_SHA" --message "commit:$WORKERS_CI_COMMIT_SHA" && pnpm ai-search:refresh && pnpm sentry:upload:worker`.
   The Builds API token and the manual workflow token
   `blakeoxford-github-actions-seo-2026-v2` both include Account AI Search Write
   and AI Search Run for that refresh. Non-production branches use Worker
   Previews (`pnpm exec wrangler preview`). The manual backup workflow accepts
   only `main`, checks the configured account ID before remote writes, and
   deploys with the project-pinned Wrangler through `pnpm deploy:worker`.
   AI Search sync creation retries only the documented `7020 sync_in_cooldown`
   response: at most three attempts, separated by 30 seconds. Authentication,
   other errors, and exhausted retries fail the build. See the
   [official error codes](https://developers.cloudflare.com/ai-search/troubleshooting/api-error-codes/).
   If refresh fails after deployment, first inspect the active Worker version:
   the new code may already serve traffic even though the overall build failed.
   CI runs `pnpm validate:worker` after building; this is a local dry run and
   does not prove preview bindings, email delivery, or production health.

### Quarterly or after an incident

1. Confirm the Cloudflare zone remains on the intended plan and the `API burst
protection` rule is active.
2. Review the 120 requests / 10 seconds threshold against legitimate traffic
   and blocked-event volume. Change it only with a documented reason and a
   rollback value.
3. Confirm required secrets exist without printing their values:
   `TURNSTILE_SECRET_KEY`. Also confirm the Worker Preview base secret of the
   same name exists (`wrangler preview base-config secret put
TURNSTILE_SECRET_KEY`) so preview contact forms can verify Turnstile
   without using production KV or email.
4. Rotate a secret if it may have been exposed, its owner is unclear, or its
   provider requires rotation. Validate the affected route immediately after.
5. Review trace volume and sampling. Current production sampling is 5%; keep
   it bounded unless the extra diagnostic value is justified.
6. Verify the previous Worker deployment remains available for rollback.
7. Confirm the AI Search route returns a non-empty message and that streamed
   requests emit `ready`, `token`, and `done` events.
8. Review scheduled canary failures and latency in Workers Logs/Sentry and the
   `ai_search_canary` Analytics Engine index.

## Failure handling

- **Synthetic monitor failure:** inspect the Cloudflare Security Events and
  Workers Logs/Traces for the same time window, then run
  `EDGE_BASE_URL=https://blakeoxford.com pnpm monitor:edge` locally. A
  Cloudflare-managed probe is authoritative for public availability; do not
  weaken Bot Fight Mode to make a GitHub-hosted request pass.
- **Worker exception burst:** use Workers Logs/Traces and Sentry, then roll back
  the Worker to the last known-good deployment if customer impact is active.
- **False-positive rate limiting:** temporarily disable the `API burst protection`
  rule, retain the application-level limits, and restore it after adjusting its
  threshold.
- **Secret failure:** disable the affected feature or route, rotate the secret,
  redeploy through the normal branch flow, and retest the route.
- **AI Search contract failure:** roll back to the previous Worker version and
  validate both JSON and SSE responses before investigating a second cutover.
  The `AI_SEARCH` binding is the production path.

## Kill switches and rollback

- **Synthetic monitor:** end the weekly test in Cloudflare; this does not affect
  production traffic. Keep the local smoke script available for deployment
  validation.
- **Worker:** roll back to the previous successful Workers deployment.
- **Rate-limit rule:** disable `API burst protection` in Cloudflare; rule ID is
  `cac8413d409f444eaef771183818a449`.
- **Traces:** set `[observability.traces].enabled = false` and redeploy if
  trace volume or cost becomes abnormal.
- **Scheduled canary:** remove the `[triggers]` block from `wrangler.toml` and
  redeploy. This disables only the canary; it does not disable AI Search or
  public traffic.

Never place secret values, client IPs, request bodies, or contact-form content
in this runbook, workflow output, or incident notes.

## Sentry application wiring

Use the existing `accelerise-consulting` team and the `blakeoxford-com` Sentry
project for browser and edge diagnostics. Environment tags separate production,
preview, and controlled verification. Blake owns the configuration and error review.

- **Build configuration:** `PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, and `SENTRY_PROJECT`
  identify the project. Store `SENTRY_AUTH_TOKEN` only as a protected build secret
  for source-map uploads. A Worker secret cannot supply a build-time credential.
- **Runtime configuration:** `SENTRY_DSN_EDGE` supplies the edge DSN. Keep the
  existing `ENVIRONMENT` separation in production and Worker Previews. Never put
  the upload credential in `PUBLIC_*`, source code, or new Worker bindings.
- **Release identity:** the browser uses `blakeoxford.com@<commit>`; the edge uses
  the raw commit. Workers Builds supplies the exact revision. Non-main browser
  builds are tagged `preview`, even though Astro compiles them in production mode.
- **Privacy and volume:** preserve the existing request-data exclusions, masked
  error replays, 10% browser trace sampling, and 5% edge trace sampling. Creating a
  project does not prove ingestion or justify enabling additional signals.
- **Source maps:** upload against this project and remove uploaded browser maps
  from `dist` before deployment. Confirm a newly triggered error has readable
  original-source frames; an older event is not repaired by a later upload.
  Worker bundles/maps stay in ignored `.wrangler/sentry`, outside public assets.
  After deployment and AI Search refresh, `pnpm sentry:upload:worker` validates
  matching maps, uploads against the raw deployed revision, and waits for Sentry
  processing. Its credential remains in build environment storage. If this final
  upload fails, inspect the active Worker before retrying; retry the map upload
  without redeploying when the exact retained bundle is available.
  Preview browser reports and trace headers are limited to this Worker under
  `blakeoxford.workers.dev`. The CSP admits only this project's ingest origin
  and local blob replay workers; the Worker/static policies have a drift test.
  A local instrumented build may explicitly set
  `PUBLIC_SENTRY_ENVIRONMENT=verification` to report loopback JavaScript errors.
  Production and preview URL filters reject loopback; never set this local
  verification override in shared Cloudflare build configuration.

Before activation, run the normal build, full audit, unit, browser, preview, and
protected promotion gates. Verify one uniquely named error through the running
application's actual initialization, then find that exact issue in Sentry. Keep
temporary failure triggers out of every published artifact. Record the issue URL,
environment, release, Worker version, and sanitized check results. Review
production errors separately from the verification marker; an empty new project
does not establish that an earlier release had no errors.

The leading indicator is a confirmed verification event with readable frames;
the lagging indicator is unexpected production exceptions for the exact release.
The initial baseline is unknown until real production telemetry arrives. Blake
reviews failures in the existing release handoff; do not assume an email alert
exists or create a second monitor to compensate.

For immediate ingestion shutdown, disable the project's client key in Sentry;
this stops both clients without interrupting site traffic. For rollback, restore
the recorded Worker version and the previous build-variable configuration.
Build variables are independent of Worker versions: remove newly added Sentry
build settings before another automatic build, and verify runtime secret/version
restoration separately. Removing `PUBLIC_SENTRY_DSN` takes effect only after a
new build; already open browser tabs may continue until the key is disabled.
Retain existing Cloudflare logs and report any failed activation to Blake.
