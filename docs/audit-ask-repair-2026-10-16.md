# Development audit and Ask repair

## Dependency evidence and remediation

Checked October 16, 2026 against npm registry metadata and the current GitHub
advisories. Direct dependencies, Wrangler, and runtime compatibility settings are
unchanged.

| Finding | Resolution |
| --- | --- |
| qs bracket-key comma array-limit bypass, GHSA-x5fp-wj9c-mxmx | Raise the existing override from 6.15.3 to compatible patched 6.16.1. Test the malicious bracketed comma-list input. |
| qs attacker-controlled isBuffer, GHSA-4mjr-xmp4-gh2g | Same upgrade. Test a query parse/stringify round-trip with the reported constructor/isBuffer keys. |
| basic-ftp listing-parser complexity, GHSA-c475-qrg2-pj4r | Scope patched 6.2.3 to get-uri. Verify the installed listing parser and Client API consumed by that parent. |
| braces recursive AST exhaustion, GHSA-vfj7-8cjw-p6xm | Apply an exact-version pnpm patch to 3.0.3, bounding parser nesting and compile/expand/stringify walkers to 128 levels. Test string and direct AST entry points through the actual stylelint → micromatch dependency path. |

The [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no
patched upstream release. Removing the optional compressor would leave other
braces consumers installed. The tracked patch implements the depth-bound approach
described in [the upstream report](https://github.com/micromatch/braces/issues/70),
while preserving ordinary glob alternation and ranges.

**Raw full audit remains nonzero:** npm identifies the upstream version as
vulnerable without inspecting local patches. It still reports the braces advisory;
this is a locally remediated finding, not an upstream advisory closure or a clean
raw audit. No audit advisory is ignored or dismissed. Production audit is checked
separately.

The [pnpm patch](https://pnpm.io/10.x/cli/patch) pins an exact version/hash and must
apply on frozen installs. Failure/unused-patch allowances are disabled. Blake owns
replacing it with a patched upstream release while retaining the regression tests.

## Ask evidence and behavior

Rendered preview showed repeated user-question bubbles before a completed answer.
Automatic retries appended a new user message each time, while a stale callback
could exceed the retry budget. This was browser repetition, not evidence of a
provider echo. Deterministic adapter regressions separately reproduce echoed
provider prefixes and contaminated history without calling a model.

The adapter requests a direct grounded answer and removes leading question echoes
from answers and history, matching both original and rewritten prompts. It preserves
non-question subjects and questions quoted later in an answer. Question-only output
is rejected. Workers AI uses the same guard.

System messages are supported by the current [Cloudflare chat-completions
API](https://developers.cloudflare.com/changelog/post/2026-03-23-ai-search-new-rest-api/).
This change does not alter provider credentials, instance configuration, models,
retrieval sources, or citation metadata.

A new answer-cache generation avoids reusing previously echoed answers. Existing
deployment refresh now clears all `ai:response:` versions; tests preserve unrelated
conversation backups. These are regenerable answer caches, not contact records.

## Browser retry lifecycle

Rendered preview acceptance exposed a second cause of repeated questions: each
retry added another user bubble, while a stale callback captured the original
retry counter and could exceed its retry budget. Three hook-level regression tests
failed before repair. Retries now carry an explicit attempt count, reuse the
original question, omit that in-flight question from history, and stop after two
retries. A new submission or unmount invalidates pending retry callbacks. A
successful answer resets the displayed retry count.

## Validation and operational limits

Before repair, eleven focused regression cases fail. After repair, validate the
focused tests, frozen install, full application checks, build, Worker dry run,
preview, hosted CI and production separately. Local deterministic tests do not
prove future model output quality; preview/live probes must verify a completed
answer, no leading question echo, citations, and Ask reopening with history.

The intentional new input limit rejects extremely deep glob/AST inputs with a
controlled SyntaxError before stack exhaustion. No real FTP server acceptance is
claimed by the listing-parser/API test.

Kill switch: stop the active build/promotion. Record the active compatible Worker
version before main merge and restore it if live acceptance fails. Blake owns
recovery; report sanitized failures in the release chat and existing GitHub/provider
logs. No storage migration is introduced. Worker rollback does not undo index or
answer-cache refresh writes; those are rebuilt by the existing refresh operation.
