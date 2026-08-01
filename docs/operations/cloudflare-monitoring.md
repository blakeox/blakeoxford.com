# Cloudflare Operations Runbook

This runbook is the low-maintenance operating contract for the production
Worker `blakeoxford-com`. It uses Cloudflare-native observability, Sentry, and
GitHub Actions. No additional monitoring vendor or secret is required.

## Signals and owners

| Signal            | Leading indicator                    | Action threshold                                           | Owner                 |
| ----------------- | ------------------------------------ | ---------------------------------------------------------- | --------------------- |
| Edge availability | `Edge Availability Monitor` workflow | Any failed scheduled run                                   | Repository maintainer |
| Worker failures   | Workers Logs / Traces and Sentry     | Any sustained error burst or repeated exception            | Repository maintainer |
| API abuse         | Cloudflare WAF/rate-limit events     | Repeated hits on `API burst protection` or customer impact | Repository maintainer |
| API contract      | CORS/debug/header smoke checks       | Any failed smoke check                                     | Repository maintainer |
| Secret health     | Secret review checklist below        | Unknown age, suspected exposure, or failed integration     | Repository maintainer |

The lagging availability indicator is the percentage of scheduled monitor runs
that pass. The target is 100%; any failure is investigated before it is treated
as noise.

## Routine checks

### After each production deployment

1. Confirm the Workers Build completed successfully for the deployed `main`
   SHA.
2. Run the monitor manually from GitHub Actions.
3. Check `/_healthz`, the homepage, CORS rejection, and the blocked debug route.
4. Review Workers Logs/Traces and Sentry for exceptions from the new release.
5. Record the deployment SHA and Worker version in the release handoff.

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

- **Monitor failure:** inspect the failed step and run the same script locally
  with `EDGE_BASE_URL=https://blakeoxford.com`. The monitor identifies its
  requests, retries transient edge denials, and prints only safe response
  metadata when the failure persists. Do not disable the monitor to clear a
  red status.
- **Worker exception burst:** use Workers Logs/Traces and Sentry, then roll back
  the Worker to the last known-good deployment if customer impact is active.
- **False-positive rate limiting:** temporarily disable the `API burst protection`
  rule, retain the application-level limits, and restore it after adjusting its
  threshold.
- **Secret failure:** disable the affected feature or route, rotate the secret,
  redeploy through the normal branch flow, and retest the route.

## Kill switches and rollback

- **Edge monitor:** disable only the scheduled workflow if its own execution is
  broken; this does not affect production traffic.
- **Worker:** roll back to the previous successful Workers deployment.
- **Rate-limit rule:** disable `API burst protection` in Cloudflare; rule ID is
  `cac8413d409f444eaef771183818a449`.
- **Traces:** set `[observability.traces].enabled = false` and redeploy if
  trace volume or cost becomes abnormal.

Never place secret values, client IPs, request bodies, or contact-form content
in this runbook, workflow output, or incident notes.
