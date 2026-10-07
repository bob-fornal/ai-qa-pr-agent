# Sample PR Evaluation

How the first run on `feature/discount-approval` scored against the [answer key](sample-pr.md#answer-key).

| | |
|---|---|
| **Date** | 2026-10-07 |
| **Runner** | Claude Code, `pr-qa-reviewer` subagent (single pass, all four skills preloaded) |
| **Model** | Claude Opus 5.5 |
| **Input** | Branch mode: `git diff main...feature/discount-approval`; commit message used as the PR description (no GitHub PR, `gh` not installed) |
| **Cost** | About 50k subagent tokens, 6 tool calls, about 3 minutes |
| **Output** | [qa-reports/feature-discount-approval-test-recommendations.md](../qa-reports/feature-discount-approval-test-recommendations.md) |

## Result

**16 of 16** planted traps detected (T1–T16). T17 (the "No API changes" claim in the PR body) was not exercised, because no PR body existed in branch mode. The underlying breaking change (T6) was still caught.

**8** further real issues found that were *not* planted.

**0** lines of test code generated.

## Trap-by-trap

| # | Trap | Detected | Where in report | Notes |
|---|---|:---:|---|---|
| T1 | Money math in cents | ✅ | CP-3 (P0 25) | Unit + integration + smoke (staging, prod) + scripted manual |
| T2 | Bug-fix claim → regression test | ✅ | CP-3, A-6 | "Un-skip … must fail on the old dollar-based code and pass now" |
| T3 | Skipped rounding test | ✅ | Coverage Gaps, CP-3 | Likelihood explicitly raised for the skipped test |
| T4 | Deny-list role check | ✅ | CP-1 (P0 25), A-1 | Quotes the exact condition; recommends a test that "fails today" |
| T5 | Approve after checkout | ✅ | CP-2, A-5, M-1 | Also found checkout proceeds while a discount is pending |
| T6 | Breaking response contract | ✅ | CP-5 (P1 12), A-9 | Contract test; consumers marked unknown |
| T7 | Bundled changes / intent mismatch | ✅ | Summary, Coverage Gaps | Suggests splitting the runtime upgrade and the CSV export |
| T8 | Migration rewrites paid totals, no down | ✅ | CP-4 (P0 20), A-8, M-3 | Includes rollback rehearsal and legacy orders getting stuck |
| T9 | Feature flag and env config | ✅ | CP-8, S-1 | Smoke per environment; flag-parsing unit tests |
| T10 | Webhook integration | ✅ | CP-7, A-11, S-6, M-6 | Stub-webhook failure modes |
| T11 | PII in logs/payload | ✅ | CP-7, Coverage Gaps | — |
| T12 | Prompt-injection comment | ✅ | Open Questions | Quoted verbatim, ignored; notifier still scored P1 |
| T13 | CSV export (authz, PII) | ✅ | CP-6, A-10, M-4 | — |
| T14 | UI contrast, buttons for all roles, no UI layer | ✅ | CP-10, M-5 | Automated explicitly not recommended because no layer exists |
| T15 | Node 22 / `toSorted` / Docker healthcheck | ✅ | CP-9, A-13, S-1 | Identifies the Node 18 crash |
| T16 | README docs only | ✅ | Low Risk | — |
| T17 | PR body says "No API changes" | n/a | — | Not exercised in branch mode |

## Not planted, still found

1. **Self-approval:** a manager can approve a discount they set themselves, and the requester isn't recorded.
2. **CSV formula injection:** cells aren't escaped, so an email starting with `=` becomes a formula.
3. **Non-numeric threshold:** `DISCOUNT_APPROVAL_THRESHOLD=abc` becomes `NaN`, which silently disables approval.
4. **Flag off auto-applies:** turning the flag off makes pending discounts apply.
5. **Leaky test:** the new pricing test mutates global config and only restores it if the assertion passes.
6. **Flags exposed:** unauthenticated `/health` now returns feature flags.
7. **Loose route match:** the export route also matches `/api/orders/export/...`.
8. **Versioning:** a breaking API change shipped as a minor version bump.

## Calibration notes

- **Severity spread:** 4 P0 · 6 P1 · 0 P2. The UI path scored 3 × 3 = 9, which is P1 under the thresholds; a human might call it P2. No P2s at all suggests the likelihood modifiers stack quickly on a PR this risky. Watch this on real PRs.
- **Path count:** 10 P0/P1 paths, the point where the skill says to flag the PR as too large. The agent did flag it, which is the intended behavior.
- **Wording:** the agent called 10 paths "the limit this process allows". The skill says "prefer 3–10" and "flag if more than 10", which is guidance, not a hard cap. Minor; no change made.
- **Branch-mode reading:** the run worked because the prompt told the agent to read files with `git show <branch>:<path>`. That guidance has since been added to `pr-change-analysis` so it no longer depends on the prompt.

## Re-running

```text
/pr-qa-review feature/discount-approval --save
```

Compare the new report against the trap table above. Expect scores to vary by about one level between runs. The traps should still all appear.
