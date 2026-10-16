# Development audit and Ask repair

Checked October 16, 2026 against registry metadata and GitHub advisories. Direct
dependencies, Wrangler, compatibility settings, credentials and models are unchanged.

| Finding | Resolution |
| --- | --- |
| qs comma array-limit bypass, GHSA-x5fp-wj9c-mxmx | Existing override raised from 6.15.3 to patched 6.16.1; malicious bracketed comma-list regression. |
| qs attacker-controlled isBuffer, GHSA-4mjr-xmp4-gh2g | Same upgrade; parse/stringify regression using constructor/isBuffer keys. |
| basic-ftp listing-parser complexity, GHSA-c475-qrg2-pj4r | Scope patched 6.2.3 to get-uri; exercise installed parser and parent-consumed Client API. |
| braces recursive AST exhaustion, GHSA-vfj7-8cjw-p6xm | Exact-version 3.0.3 pnpm patch bounds parser and compile/expand/stringify depth to 128; string/direct-AST regressions and normal glob checks. |

The [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched
release. Removing the optional compressor leaves other consumers. The tracked patch
uses the depth bound described in the [upstream report](https://github.com/micromatch/braces/issues/70).
**Full raw audit remains nonzero:** registry audit identifies upstream braces without
inspecting local patches. This is local remediation, not upstream closure. No advisory
is suppressed. Production audit is separate. The [pnpm patch](https://pnpm.io/10.x/cli/patch)
pins version/hash and must apply on frozen installs; failure/unused allowances are off.
Blake owns replacing it with an upstream fix while retaining the regression tests.

## Ask behavior

Preview exposed duplicate user bubbles during retries; the completed assistant answer
was direct. Provider-prefix and contaminated-history behavior are independently covered
by deterministic regressions. The adapter removes question echoes against original and
rewritten prompts, including saved history, and preserves non-question subjects and
embedded quotes. Question-only output is rejected. Workers AI uses the same guard.
The supported [system message](https://developers.cloudflare.com/changelog/post/2026-03-23-ai-search-new-rest-api/)
requests direct grounded answers. Citation metadata and retrieval sources are preserved.
Answer-cache v5 avoids old replies; refresh clears all `ai:response:` generations while
preserving unrelated conversation backups. These caches are regenerable.

## Browser retry lifecycle

Rendered preview acceptance exposed a second cause of repeated questions: each
retry added another user bubble, while a stale callback captured the original
retry counter and could exceed its retry budget. Three hook-level regression tests
failed before repair. Retries now carry an explicit attempt count, reuse the
original question, omit that in-flight question from history, and stop after two
retries. A new submission or unmount invalidates pending retry callbacks. A
successful answer resets the displayed retry count.

## Validation and recovery

Keep frozen install, full checks, build/dry run, rendered preview, hosted CI and live
runtime evidence separate. Verify complete answers, one question, citations and history
on reopen; deterministic tests do not guarantee future model quality. Deep glob/AST
inputs now raise controlled SyntaxError. Real FTP-server acceptance is not claimed.
Stop build/promotion on failed validation. Record the active Worker before main merge
and restore it if acceptance fails. Blake owns recovery, with sanitized failures in
this release chat and GitHub/provider logs. No storage migration is introduced. Worker
rollback does not undo regenerable index/cache refresh writes.
