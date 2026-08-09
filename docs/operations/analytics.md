# Analytics Operations

This is the production analytics contract for `blakeoxford.com`. The goal is
decision-grade measurement with the smallest durable vendor surface. Analytics
must describe journeys and system health; it must not become a copy of user
content.

## Platform roles

| Platform | Role | Data boundary | Owner | Kill switch |
| --- | --- | --- | --- | --- |
| Cloudflare Web Analytics | Aggregate traffic, SPA navigation, and real-user performance | Privacy-first aggregate RUM; no custom content | Repository maintainer | Remove `PUBLIC_CF_WEB_ANALYTICS_TOKEN` from the production build or disable the site in Cloudflare |
| GA4 through Cloudflare Zaraz | Acquisition, page views, and conversion funnels | Bounded event names and dimensions only; query parameters and IP/user agent hidden in Zaraz | Repository maintainer | Disable the GA4 tool in Zaraz; leave the app event contract intact |
| Microsoft Clarity | UX diagnostics and session replay for interaction problems | Low-cardinality event names/tags only; no prompts, responses, IDs, or form content | Repository maintainer | Remove `PUBLIC_CLARITY_PROJECT_ID` from the build or disable the project |
| Sentry | Browser and Worker exceptions | Error diagnostics governed by Sentry configuration; no analytics payloads | Repository maintainer | Disable the affected Sentry integration or reduce sampling |
| Cloudflare Analytics Engine | AI Search canary and operational telemetry | Success/error, latency, response length, and bounded dimensions; no prompts or responses | Repository maintainer | Remove the Cron Trigger or set the operational telemetry path to no-op |

Do not add Plausible, Google Tag Manager, Mixpanel, or another general-purpose
platform without replacing an existing role. Each would add consent, schema,
retention, and operational review burden without closing a current measurement
gap. If Cloudflare Web Analytics is not available, GA4/Zaraz plus Sentry still
cover the required product and reliability signals.

## Event contract

All browser events pass through `src/lib/analytics.ts`:

- Event names are lowercase `snake_case`.
- Strings are trimmed, control characters are removed, and values are capped.
- Direct identifiers and content fields are dropped centrally, including email,
  prompts, queries, responses, message IDs, session IDs, user IDs, URLs, and
  referrers.
- Acquisition is reduced to `organic`, `referral`, `direct`, `internal`, or
  `unknown`; raw referrer data is never sent.
- Command Center links are represented by bounded path values, not full URLs.
- Core Web Vitals report metric, value, rating, and navigation type. Random
  metric IDs are intentionally excluded because they do not support aggregate
  decisions.

The primary product events are `generate_lead`, `chat_engagement`,
`command_center_*`, `autorag_*`, and `web_vitals`. Add an event only when it
changes a product or reliability decision and document its owner and action
threshold here.

## Measurement model

| Decision | Leading indicator | Lagging indicator | Owner |
| --- | --- | --- | --- |
| Are qualified visitors finding the right path? | Organic/referral share and command-center handoffs | Contact submissions by acquisition source | Repository maintainer |
| Is the contact path working? | Form starts, validation failures, and Turnstile failures | Successful `generate_lead` events and delivered contact messages | Repository maintainer |
| Is Ask useful? | Suggested-action clicks, retries, response metadata, and bounded quality scores | Positive/negative feedback rate and completed chat engagement | Repository maintainer |
| Is the site fast enough? | LCP, INP, CLS, FCP, and TTFB ratings | Search visibility and conversion completion | Repository maintainer |
| Is the system reliable? | Sentry errors, Worker failures, and AI canary latency | Availability and incident count | Repository maintainer |

Do not treat platform dashboards as proof that a conversion completed. Pair
browser events with server-side contact delivery and Worker/Sentry evidence.
This prevents ad blockers, script failures, or replay sampling from overstating
business outcomes.

## Activation gates

### Foundation

1. Keep the event contract and `pnpm quality:analytics` green.
2. Configure `PUBLIC_CLARITY_PROJECT_ID` in the production build environment.
   The repository already has the intended project ID in the deploy workflow;
   local builds may intentionally omit it.
3. Create or enable the `blakeoxford.com` site in Cloudflare Web Analytics and
   store its site token in the approved deployment secret
   `PUBLIC_CF_WEB_ANALYTICS_TOKEN`. The current Wrangler OAuth identity does
   not have the account permission required to create or list RUM sites, so use
   the Cloudflare dashboard or an explicitly approved narrowly scoped token.

### Core functionality

1. If GA4 reporting is required, obtain the real `G-...` Measurement ID through
   approved secret/configuration management. Never commit it as a placeholder.
2. Generate the Zaraz import with:

   ```sh
   GA4_MEASUREMENT_ID=G-XXXXXXXXXX pnpm exec node scripts/setup/deploy-zaraz.mjs --write-only
   ```

3. Import and publish the generated configuration in Cloudflare Zaraz, then
   verify one page view, `generate_lead`, and one bounded chat event. Do not
   enable GA4 until the ID and Zaraz permission are both present.

### Stabilization and hardening

- Run `pnpm quality:analytics`, `pnpm check`, `pnpm build`,
  `pnpm monitor:edge`, and `pnpm monitor:seo` after analytics changes.
- Confirm built HTML contains the configured Clarity project ID only when the
  deployment explicitly enables Clarity.
- Confirm no analytics request contains prompts, responses, contact fields,
  raw URLs, referrers, or message identifiers.
- Review Sentry and Cloudflare logs after deployment; analytics failures must
  never block navigation, chat, or contact submission.

## Failure handling and rollback

- **Most likely failure:** a vendor is configured but receives no events because
  an ad blocker, missing build variable, or Zaraz publish step prevents loading.
  Check live HTML/network evidence and the build activation contract.
- **Most expensive failure:** contact or chat content is sent to an analytics or
  replay vendor. Disable the affected vendor, preserve the deployment SHA,
  rotate any exposed configuration if needed, and review retention/access logs.
- **Silent failure:** event names or dimensions drift while dashboards continue
  to load. The source contract, privacy sanitizer, and deployment checks are
  the control against this failure.

The application remains functional with all analytics disabled. That is the
kill switch: remove the relevant build variable, disable the Zaraz tool, or
remove the AI canary trigger. Never weaken form validation, Turnstile, CSP, or
rate limits to recover analytics.
