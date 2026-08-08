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
```

`quality:seo` checks the emitted HTML and sitemap for canonical URLs, indexability, titles,
descriptions, social metadata, JSON-LD, published-route parity, and duplicate sitemap surfaces.
Metadata length is editorial guidance, not a blocking SEO invariant; the gate blocks empty,
duplicate, malformed, or mismatched metadata instead. The renderer still bounds generated
description output at the shared maximum.

## Live review checklist

- [ ] Confirm the deployed commit through `/__version`.
- [ ] Fetch `/robots.txt` and `/sitemap.xml`; confirm robots has exactly one canonical sitemap directive and `/sitemap-index.xml` and `/sitemap-0.xml` are 404/410.
- [ ] Verify HTTP apex, HTTP `www`, and HTTPS `www` requests each return one permanent 308 redirect to the HTTPS apex slash URL.
- [ ] Verify every URL emitted by the canonical sitemap returns a direct 200 response without a redirect.
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

## Baseline snapshot: 2026-08-04

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
no field LCP, INP, or CLS values are claimed here. Re-run after deployment and append the field
values and Search Console property date before closing the performance and measurement issues.
