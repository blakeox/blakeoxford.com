# Cloudflare Operations Runbook

This runbook is the low-maintenance operating contract for the production
Worker `blakeoxford-com`. It uses Cloudflare Synthetic Monitoring, Cloudflare
native observability, Sentry, and the local smoke script. No additional
monitoring vendor or secret is required.

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

### Quarterly or after an incident

1. Confirm the Cloudflare zone remains on the intended plan and the `API burst
protection` rule is active.
2. Review the 120 requests / 10 seconds threshold against legitimate traffic
   and blocked-event volume. Change it only with a documented reason and a
   rollback value.
3. Confirm required secrets exist without printing their values:
   `TURNSTILE_SECRET_KEY` and the legacy `search-api` credential.
4. Rotate a secret if it may have been exposed, its owner is unclear, or its
   provider requires rotation. Validate the affected route immediately after.
5. Review trace volume and sampling. Current production sampling is 5%; keep
   it bounded unless the extra diagnostic value is justified.
6. Verify the previous Worker deployment remains available for rollback.

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

## Kill switches and rollback

- **Synthetic monitor:** end the weekly test in Cloudflare; this does not affect
  production traffic. Keep the local smoke script available for deployment
  validation.
- **Worker:** roll back to the previous successful Workers deployment.
- **Rate-limit rule:** disable `API burst protection` in Cloudflare; rule ID is
  `cac8413d409f444eaef771183818a449`.
- **Traces:** set `[observability.traces].enabled = false` and redeploy if
  trace volume or cost becomes abnormal.

Never place secret values, client IPs, request bodies, or contact-form content
in this runbook, workflow output, or incident notes.
