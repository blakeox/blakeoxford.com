# Site search

Find (`/api/semantic-search`) uses the existing `AI_SEARCH` instance, `bold-heart-18e4`, for hybrid keyword/vector retrieval with reranking. It returns indexed passages and links without generating an answer. Ask continues to use its existing separate answer flow.

The browser shows local keyword results while the managed request runs. Exact title destinations take priority; other managed matches retain their reranked order. Duplicate chunks collapse to a single canonical site destination. Only HTTPS links on blakeoxford.com are accepted from managed retrieval. The server waits at most eight seconds for managed retrieval; the browser bounds its complete request to twelve seconds. Existing Vectorize retrieval is the server fallback. If the request fails, local keyword results remain usable with an explicit availability message. Query changes cancel obsolete browser requests and invalidate late responses.

## Operation and rollback

Owner: Blake. No new services, indexes, credentials, or dependencies are required. Public query text is sent to the existing Cloudflare search binding. Raw query text and IP addresses are omitted from the search Analytics Engine event; existing short-lived IP rate-limit keys remain in use. Sanitized provider-failure logs include the request ID, elapsed time, and a bounded reason (timeout, invalid_response, or provider_error). Raw provider exception text is omitted. The `site_search` analytics event records provider, result count, top score, and latency. This change adds no notification automation.

`SEARCH_PROVIDER` is an optional Worker variable:

- Unset or `ai-search`: managed retrieval first, existing Vectorize fallback.
- `vectorize`: bypass managed retrieval, retaining the previous provider.
- `local`: return 503 so browsers use keyword search; does not disable Ask.

Apply variables through the repository's normal reviewed Worker release process. Roll back the Worker to its recorded prior version to undo the server change; revert the scoped source change for the UI. Do not create or rebuild an index to resolve an authentication failure.

## Validation gates

Before release, run typecheck, the unit suite, a build and Worker dry run. Run `navbar-refinement.spec.ts` and `ui/managed-search.spec.ts` against built output in Chromium and WebKit. Browser provider responses in the latter are controlled fixtures, not evidence of a live binding.

After an authorized preview deployment, verify the actual endpoint returns `provider: ai-search` for `Microsoft Fabric` and `workflow automation`, deduplicates links, and returns safe empty results for an unrelated query. Verify rate limits, keyword fallback, mobile focus, and System appearance. Inspect provider failures, zero-result rate and latency in the existing logs/analytics before promotion. Treat the previous Vectorize behavior as the comparison baseline; set performance targets from measured preview results.

Current API reference: https://developers.cloudflare.com/ai-search/api/search/workers-binding/

### Opt-in live browser journey

`tests/playwright/ui/search-cloudflare-live.spec.ts` is skipped unless `SEARCH_LIVE=1`. Point a temporary Playwright configuration's `baseURL` at an isolated local Worker serving the built assets and using the existing remote `AI_SEARCH` binding; disable the default preview launcher. Run Chromium and WebKit with one worker and no retries. This checks real managed retrieval, canonical links, empty results, dialog accessibility, desktop keyboard/mobile touch navigation, and recovery from a deliberately injected local 503. The injected failure is not provider-outage evidence. Each test attaches bounded provider/request-ID/latency evidence without indexed passages. Stop the temporary Worker after validation. Local remote-binding success remains separate from deployed preview/production acceptance, rate-limit coverage, and analytics delivery.
