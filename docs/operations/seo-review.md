# SEO operating review

This is the repeatable review for the public acquisition surface. It deliberately keeps
repository evidence separate from live search and field evidence.

## Repository gate

Run from the repository root:

```bash
pnpm build
pnpm quality:seo
pnpm typecheck
pnpm lint
pnpm exec vitest run tests/vitest/contentArchitecture.test.ts
```

`quality:seo` checks the emitted HTML and sitemap for canonical URLs, indexability, titles,
descriptions, social metadata, JSON-LD, published-route parity, and duplicate sitemap surfaces.
Metadata length is editorial guidance, not a blocking SEO invariant; the gate blocks empty,
duplicate, malformed, or mismatched metadata instead. The renderer still bounds generated
description output at the shared maximum.

The content architecture contract checks that every indexable acquisition route has a documented
intent, contextual relationship, and bounded topic/query entry. Query themes are editorial planning
inputs only; they are not emitted as `meta keywords` and must be reconciled against Search Console
evidence before content priorities are changed.

## Live review checklist

- [ ] Confirm the deployed commit through `/__version`.
- [ ] Fetch `/robots.txt` and `/sitemap.xml`; confirm robots has exactly one canonical sitemap directive and `/sitemap-index.xml` and `/sitemap-0.xml` are 404/410.
- [ ] Verify HTTP apex, HTTP `www`, and HTTPS `www` requests each return one permanent 308 redirect to the HTTPS apex slash URL.
- [ ] Verify every URL emitted by the canonical sitemap returns a direct 200 response without a redirect.
- [ ] Run `pnpm monitor:seo`; confirm route-wide live HTML parity for every sitemap URL, including canonical, metadata, robots, schema, and H1 checks.
- [ ] Submit the canonical sitemap in Google Search Console.
- [ ] Verify or explicitly defer Bing Webmaster Tools and record the reason.
- [ ] After the IndexNow key file is deployed, submit only added, updated, or deleted URLs with `pnpm indexnow:submit -- --url <url>`; use `--sitemap` only for an intentional bulk submission.
- [ ] Record indexed canonical URLs and exclusion reasons.
- [ ] Record impressions, clicks, CTR, top queries, and top landing pages.
- [ ] Record qualified organic contact submissions without storing query strings or personal data.
- [ ] Review field LCP, INP, and CLS for the homepage, blog hub, project hub, one case study, and one article.
- [ ] Compare the result with the previous review; open an issue for regressions.

## Ownership and privacy

The site owner is responsible for Search Console/Bing access and the review record. Engineering
owns the repository gate and deployment verification. Analytics review must use aggregate events;
do not copy search queries, email addresses, form content, or other personal data into this file.

The repository does not claim Search Console, Bing, field Core Web Vitals, or organic conversion
success until the live evidence is recorded after deployment.

IndexNow is an acceleration signal, not an indexing guarantee. The public key file proves URL
submission ownership; it does not grant access to site content or analytics. Keep submissions
explicit to avoid repeatedly consuming crawler quota for unchanged URLs.

The contact form emits a `generate_lead` event with only a bounded
`acquisition_source` category (`organic`, `referral`, `direct`, `internal`, or `unknown`). The
implementation does not send or retain the referrer URL, search query, form contents, or email
address. Use this event as the aggregate organic-contact conversion measure after the analytics
property is verified.

## Historical production and measurement state: 2026-08-13

Reviewed against production merge `0278cca7b5bf60475460ca55b82f25c2955b69e5`, the
Cloudflare deployment surface, the protected GitHub release receipts, and the latest available
authenticated provider snapshot:

- Protected promotion completed through [PR #516](https://github.com/blakeox/blakeoxford.com/pull/516),
  [PR #517](https://github.com/blakeox/blakeoxford.com/pull/517), and
  [PR #518](https://github.com/blakeox/blakeoxford.com/pull/518).
- Main [Comprehensive CI run 31760658256](https://github.com/blakeox/blakeoxford.com/actions/runs/31760658256)
  passed the full test suites, emitted SEO contract, E2E, performance/Lighthouse, and the
  validation-only Optimization Tasks job. Optimization Tasks passed advanced optimization,
  Cloudflare Functions validation, validation report generation, and artifact upload without
  pushing a repository commit.
- Main [Deployment Status Check 31760658199](https://github.com/blakeox/blakeoxford.com/actions/runs/31760658199),
  [Push on main 31760657750](https://github.com/blakeox/blakeoxford.com/actions/runs/31760657750),
  [Fast CI 31760658319](https://github.com/blakeox/blakeoxford.com/actions/runs/31760658319),
  CodeQL, Security/Dependency Scan, NUC-backed Act Local, and Act Essential all passed.
- Live smoke returned HTTP 200 for `/`, `/robots.txt`, `/sitemap.xml`,
  `/projects/?filter=microsoft-fabric`, `/projects/ferment-app`, and
  `/blog/building-my-own-local-llm-stack/`. Robots points to the canonical `/sitemap.xml`;
  the filtered project URL emits `noindex`; both historical routes emit JSON-LD.
- The latest authenticated Google Search Console snapshot remains the 2026-08-10 receipt:
  the personal-site property had 18 discovered sitemap pages; Performance (2026-05-08 through
  2026-08-07) showed 737 impressions, 9 clicks, 1.2% average CTR, and 16.7 average position.
  Page indexing showed 16 indexed and 14 not indexed, including two historical query alternates.
- Search Console's latest available structured-data receipt still reported two historical parsing
  errors for `/projects/ferment-app` and `/blog/building-my-own-local-llm-stack/`; current
  production JSON-LD is valid and #501 remains open for the refreshed provider result.
- Bing's available property state remains the prior personal-property sitemap receipt in
  `Processing`, with 0 errors, 0 warnings, and 1 known sitemap; no new Bing crawl or performance
  data is claimed without an authenticated property receipt.
- Cloudflare Zaraz remains configured for GA4 with privacy controls that hide IP addresses, user
  agents, query parameters, and external referrers. This proves collection configuration, not a
  qualified organic lead. Qualified organic contact counts remain pending.
- #515 is closed because the production optimization job now validates and uploads artifacts
  without mutating the repository. #482, #483, #500, and #501 remain open only for their
  Search Console, Bing, or qualified-organic-measurement acceptance evidence.

The production release enforces an edge-level `X-Robots-Tag: noindex, nofollow` response for
query-bearing HTML requests, addressing the legacy `?filter=` crawl surface tracked in #500.
The control is deployed and live-verified; Search Console exclusion/re-crawl confirmation remains
the provider gate.

Facebook validation is intentionally out of scope. X/Twitter card validation remains a separate
provider-authenticated check.

## Final provider acceptance and current production state: 2026-08-15

Reviewed against production commit `5a51a4d6365a60a4a15b3d1d8e64d42e38c793ce`, the protected GitHub release receipts, Cloudflare live smoke, authenticated Google Search Console, Google Analytics, and the current Bing Webmaster Tools session:

- Protected promotion completed through [PR #526](https://github.com/blakeox/blakeoxford.com/pull/526), [PR #527](https://github.com/blakeox/blakeoxford.com/pull/527), and [PR #528](https://github.com/blakeox/blakeoxford.com/pull/528). Main [Comprehensive CI 31886850716](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850716), [Deployment Status Check 31886850687](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850687), [Push on main 31886850448](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850448), [Act Essential 31886850711](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850711), [NUC-backed Act Local 31886850681](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850681), and [Security/Dependency Scan 31886850677](https://github.com/blakeox/blakeoxford.com/actions/runs/31886850677) passed.
- `/__version` reports the production commit above. Live smoke returned 200 for `/`, `/robots.txt`, `/sitemap.xml`, `/__version`, the filtered project route, and both representative historical JSON-LD routes. Query-bearing HTML returns `X-Robots-Tag: noindex, nofollow`; robots names the canonical `/sitemap.xml`.
- Google Search Console sitemap receipt: `https://blakeoxford.com/sitemap.xml`, submitted 2026-08-08, last read 2026-08-11, Success, 18 discovered pages, 0 videos.
- Google Search Console Web Performance receipt (2026-05-14 through 2026-08-13; report updated within the current review): 708 impressions, 8 clicks, 1.1% average CTR, average position 18.8. Page indexing shows 16 indexed and 14 not indexed. The two legacy filter URLs are explicitly not indexed or served and are classified as Alternate page with proper canonical tag; their last crawls are 2026-08-08 and 2026-08-04; Duplicate without user-selected canonical is 0.
- Google Search Console structured-data receipt (last updated 2026-08-13): Invalid 0; the historical `Parsing error: Missing '}' or object member name` rule is Passed with 0 pages.
- Google Analytics lead receipt (2026-07-18 through 2026-08-14): one `generate_lead` event/new lead, attributed to Direct; Organic Search = 0, Qualified leads = 0, Converted leads = 0. The event contract contains only bounded acquisition categories and no query strings, contact fields, or personal data.
- Bing Webmaster Tools recognizes the `blakeoxford.com/` property through the current Microsoft session, but its Sitemaps and Search Performance views report that the session is unauthorized to access the site. The existing canonical sitemap/defer operating decision remains in place; no duplicate property or manual URL submission was created.
- SEO issues #482, #483, #500, #501, and #502 are closed with the receipts above; rollup #485 is closed. Facebook validation remains intentionally out of scope.

The provider gates are complete for the current release. Continue the recurring review for future changes, especially Search Console index coverage, organic lead attribution, Bing authorization, and field Core Web Vitals.

## Performance targets and ownership

Engineering owns the repository and lab gates; the site owner owns the Search Console, analytics,
and field-data review. The shared targets are:

- Field Core Web Vitals at the 75th percentile: LCP ≤ 2,500 ms, INP ≤ 200 ms, and CLS ≤ 0.1.
- Lab Lighthouse guardrails: LCP ≤ 2,500 ms, CLS ≤ 0.1, and TBT ≤ 200 ms. TBT is a lab
  responsiveness proxy and must not be reported as INP.
- Conversion guardrail: a successful contact submission must continue to emit `generate_lead`
  without personal or query-string data.

The thresholds are intentionally aligned with `scripts/build/performance-test.js`; any change to
them must update this contract and the relevant CI test in the same change.

## Historical lab baseline snapshot: 2026-08-04

The following is a reproducible Lighthouse 13 lab snapshot against the currently deployed
production build. It is a release baseline, not field data and not a validation of the current
unpublished worktree. Values are single runs and should be compared using the same route,
form factor, and audit configuration.

| Route                                         | Form factor | Performance |      LCP |    CLS |      TBT | INP audit    |
| --------------------------------------------- | ----------- | ----------: | -------: | -----: | -------: | ------------ |
| `/`                                           | Desktop     |          38 | 3,221 ms | 0.0005 | 2,455 ms | Not reported |
| `/`                                           | Mobile      |          89 | 1,565 ms |      0 |   443 ms | Not reported |
| `/about/`                                     | Mobile      |          50 | 4,664 ms |      0 | 1,582 ms | Not reported |
| `/projects/adp-workforcenow/`                 | Mobile      |          64 | 3,281 ms |  0.003 | 1,510 ms | Not reported |
| `/blog/ai-statistics-future-decision-making/` | Mobile      |          62 | 1,746 ms |  0.191 | 2,289 ms | Not reported |

The mobile homepage result came from the multi-route performance run; that run terminated with
a Lighthouse browser target crash on a later route. The standalone desktop homepage run completed
successfully. The PageSpeed Insights API returned HTTP 429 quota exhaustion during this review, so
no field LCP, INP, or CLS values are claimed here. Retain this as the historical lab comparator;
append fresh field values and Search Console property dates before closing the performance and
measurement issues.
