# Presentation Guide

**Deck:** [AI QA PR Agent](https://claude.ai/artifact/PPekX7bmszKahTheTodhXf). 25 slides, with speaker notes and timings on every slide. The deck is private until you share it from its Share menu. It can be exported to PowerPoint or PDF.

**Length:** about 43 minutes of content plus Q&A. It fits 30–50 minutes using the cuts below.

## Running order

| # | Slide | Section | Time | Minutes |
|---|---|---|---|---|
| 1 | What should we test in this PR? | Why | 0:00 | 1.5 |
| 2 | Agenda | Why | 1:30 | 1 |
| 3 | The problem | Why | 2:30 | 2 |
| 4 | The goal | Why | 4:30 | 1 |
| 5 | What you get: one report per PR | What | 5:30 | 2 |
| 6 | Why recommendations, not test code | What | 7:30 | 1.5 |
| 7 | How it works: four-stage pipeline | How | 9:00 | 2 |
| 8 | Five skills, one source of truth | How | 11:00 | 1.5 |
| 9 | Ranking risk: impact × likelihood | How | 12:30 | 2 |
| 10 | Three kinds of testing | How | 14:30 | 2 |
| 11 | Common patterns *(optional)* | How | 16:30 | 1.5 |
| 12 | The matrix is the part people read | How | 18:00 | 1.5 |
| 13 | Same skills, two tools | How | 19:30 | 1.5 |
| 14 | Guardrails | How | 21:00 | 1.5 |
| 15 | Demo: the order service | Demo | 22:30 | 1.5 |
| 16 | Sixteen planted traps | Demo | 24:00 | 2 |
| 17 | Running it live | Demo | 26:00 | 4 |
| 18 | What it found | Demo | 30:00 | 3 |
| 19 | Scorecard | Demo | 33:00 | 2 |
| 20 | What building it taught us *(optional)* | Demo | 35:00 | 2 |
| 21 | Adopting it | Adopt | 37:00 | 2 |
| 22 | Tuning | Adopt | 39:00 | 1.5 |
| 23 | Limits | Adopt | 40:30 | 1.5 |
| 24 | Where it could go next | Adopt | 42:00 | 1 |
| 25 | Questions? | Close | 43:00 | 2–7 |

## Fitting the slot

| Slot | Do this |
|---|---|
| **30 min** | Skip slides 11 and 20. On slide 17, don't run live; open the saved report. Keep Q&A to 3 minutes. |
| **40 min** | As written, with about 5 minutes of Q&A. |
| **50 min** | Run the skill live on slide 17 and take questions during the 3-minute run. Open a Copilot run beside the Claude run to show parity. Q&A 7+ minutes. |

## Demo preparation

Before the talk:

1. `git checkout main`, then `cd sample-app` and run `npm test` (13 pass).
2. Have `git diff --stat main...feature/discount-approval` ready to show.
3. Open [the saved report](../qa-reports/feature-discount-approval-test-recommendations.md) in a tab as a backup.
4. Optional: open the PR on GitHub (see [sample-pr.md](sample-pr.md)) so you can run `/pr-qa-review <number>` and show T17, the PR-body claim.
5. Optional: run `npm start` in the sample app, sign in as `sam`, set a 30% discount on order 1001 with `FEATURE_DISCOUNT_APPROVAL=true`, and show the low-contrast banner.

During the demo:

1. Run `/pr-qa-review feature/discount-approval --save` (Claude Code), or `/qa-pr feature/discount-approval` (Copilot).
2. While it runs, narrate the stages: diff → categories → callers of `calculateTotal`, `hasRole` and the new routes → scoring.
3. Walk the matrix (slide 18), then scroll to **Open Questions** and point at the quoted prompt-injection comment.
4. Compare with the answer key (slide 19).

## Likely questions

| Question | Short answer |
|---|---|
| How much does a run cost? | About 50k tokens and 3 minutes for this 15-file PR in single-pass mode. |
| Is Copilot as good as Claude here? | Same skills and rules; Copilot runs them in one agent rather than two subagents, so expect a little less depth on very large PRs. |
| Can it write the tests too? | Deliberately not. The Given/When/Then ideas can feed a separate step. |
| Could a malicious PR trick it? | The skills treat PR content as data and quote any embedded instructions. The demo plants one. It reduces risk; it isn't a guarantee. |
| Will it give the same answer every time? | Structure yes; scores can move about one level. The explicit arithmetic makes differences easy to discuss. |
| Does it post to the PR? | Not unless you explicitly ask in that session. |
