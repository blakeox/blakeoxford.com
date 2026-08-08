# IndexNow operating procedure

IndexNow is a notification channel for canonical URLs that were added, updated, or deleted.
It accelerates discovery; it does not guarantee crawling or indexing.

## Preconditions

Before submitting URLs:

1. Confirm the intended production commit through `/__version`.
2. Confirm the public key file returns HTTP 200 and contains its filename key.
3. Confirm the canonical sitemap and each submitted URL are direct HTTPS responses on
   `blakeoxford.com`.
4. Confirm Bing Webmaster Tools is using the personal `blakeoxford.com/` property.

Do not submit from a dirty local worktree or before deployment provenance is verified. A
successful API response only proves that IndexNow received the notification.

## Submission policy

Use explicit URLs by default:

```bash
pnpm indexnow:submit -- \
  --url https://blakeoxford.com/example/ \
  --url https://blakeoxford.com/another-example/
```

Use the sitemap mode only for an intentional, reviewed bulk submission:

```bash
pnpm indexnow:submit -- --sitemap https://blakeoxford.com/sitemap.xml
```

Validate a sitemap without sending a notification:

```bash
pnpm indexnow:submit -- --sitemap https://blakeoxford.com/sitemap.xml --dry-run
```

Submit only URLs changed since IndexNow activation. Do not replay the entire historical site
or submit redirects, non-canonical URLs, query variants, or fragments. The utility de-duplicates
URLs, limits each request to the protocol maximum, retries transient `429`/`5xx` responses with
bounded backoff, and fails closed on key, host, scheme, or sitemap-contract errors.

## Evidence to retain

Record the deployment commit, key-file HTTP status, submission timestamp, submitted URL count,
API result, and Bing Webmaster Tools receipt. Do not record the key value, contact data, search
queries, or form contents.

## Failure handling

- `403`: stop and verify the deployed key filename and file contents.
- `422`: stop and verify every URL belongs to the canonical HTTPS host.
- `429` or `5xx`: allow the bounded retry policy to complete; rerun only after checking the
  previous result to avoid unnecessary crawl demand.
- A successful receipt with no indexing: review canonical, robots, sitemap, response status, and
  Bing Webmaster Tools exclusion reason. Do not treat receipt as an indexing guarantee.

## Ownership and kill switch

Engineering owns the repository contract and deployment verification. The site owner owns Bing
Webmaster Tools verification and search-performance review. The kill switch is procedural: stop
running the submission command and remove the public key file in a separately reviewed release if
ownership must be revoked. No automatic submission runs until production-parity deployment is
reliable and an owner explicitly accepts the added release coupling.
