# Development audit and Ask repair

Checked October 16, 2026. Direct dependencies, Wrangler, compatibility settings, credentials and models are unchanged.

| Finding | Resolution |
| --- | --- |
| qs comma array-limit bypass, GHSA-x5fp-wj9c-mxmx | Override 6.15.3 → patched 6.16.1; malicious comma-list regression. |
| qs attacker-controlled isBuffer, GHSA-4mjr-xmp4-gh2g | Same upgrade; constructor/isBuffer parse/stringify regression. |
| basic-ftp parser complexity, GHSA-c475-qrg2-pj4r | Scope patched 6.2.3 to get-uri; installed parser/Client API checks. |
| braces AST exhaustion, GHSA-vfj7-8cjw-p6xm | Exact-version 3.0.3 patch bounds parser and compile/expand/stringify depth to 128; string/direct-AST regressions and normal glob checks. |

[braces has no patched release](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Other consumers remain if compression is removed.
The patch follows the [upstream depth-bound approach](https://github.com/micromatch/braces/issues/70).
Full raw audit still flags upstream braces without inspecting local patches; local remediation is not upstream closure.
No advisory is suppressed. Production audit is separate. The [pnpm patch](https://pnpm.io/10.x/cli/patch) pins version/hash;
frozen installs must apply it, with failure/unused allowances off. Blake owns replacing it with an upstream fix, retaining tests.

Preview showed duplicate user bubbles during retries; the completed answer was direct. Provider echo regressions are separate.
The adapter removes original/rewritten question prefixes from answers/history, preserves non-question subjects and embedded quotes,
rejects question-only output, and deduplicates the original current question. Workers AI uses the same answer guard.
A supported [system message](https://developers.cloudflare.com/changelog/post/2026-03-23-ai-search-new-rest-api/) requests grounded answers.
Citations/retrieval are preserved. Cache v5 avoids old replies; refresh clears all answer generations, preserving conversation backups.

Validate frozen install, full checks, build/dry run, preview, CI and live runtime separately. Verify complete answers, one question,
citations and history on reopen. Deterministic tests do not guarantee model quality. Deep inputs now raise controlled SyntaxError;
real FTP-server acceptance is not claimed. Stop failed build/promotion, restore the recorded prior Worker if acceptance fails.
Blake owns recovery through this chat and sanitized GitHub/provider logs. No storage migration; rollback does not undo regenerable
index/cache refresh writes.
