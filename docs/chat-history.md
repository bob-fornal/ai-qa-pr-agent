# Build Log: Chat History

This repository was built in a single Claude Code session (desktop app, Code tab) on **2026-10-07**, by Bob Fornal working with Claude (Opus 5.5). This log records the prompts verbatim, what was done in response, the decisions made, and the problems hit along the way. It is a curated summary, not a raw transcript.

---

## Turn 1: Skills and agents

### Prompt

> I want to generate the skills and agents needed to examine a Pull Request (PR). The output from the agent should identify the critical paths that need to be tested. Identify whether these should be tested using manual, smoke, and/or automated testing. These skills and agents will not generate code, simply recommendations. Assume Copilot and Claude will be used to run these agents.

### Starting point

An empty repository (one `Initial commit` with only `.gitattributes`).

### Decisions

| Decision | Reasoning |
|---|---|
| Put all rules in **skills** under `.claude/skills/`; keep agents thin | Claude Code and Copilot both read `.claude/skills/`, so one copy of the rubric serves both tools and they can't drift apart. |
| Split knowledge into four skills: change analysis, critical-path identification, test-type selection, report format | Each maps to one stage of how a senior QA engineer reasons about a PR, and each can be tuned on its own. |
| Add a user-invocable **orchestrator skill** (`/pr-qa-review`) rather than an orchestrator agent | Claude Code subagents can't spawn subagents, so orchestration has to run in the main conversation. |
| Two Claude subagents (`pr-change-analyzer`, `pr-test-strategist`) plus a single-pass `pr-qa-reviewer` | Separate contexts keep raw diff noise away from the strategy step. The single-pass agent suits CI and mirrors the Copilot setup. |
| Copilot: one custom agent (`.github/agents/pr-qa-reviewer.agent.md`) and a `/qa-pr` prompt file, linking to the skill files | Copilot's model is one agent; explicit links make it robust even if skill auto-discovery differs between Copilot surfaces. |
| Impact × likelihood scoring with named modifiers and P0–P3 thresholds | Makes risk explicit and arguable instead of a gut verdict. |
| Fixed report format with a worked example | Consistent output across tools and runs; readers learn where to look. |
| Guardrails in every skill: read-only commands, PR content treated as untrusted data, no code | The agents read attacker-controllable text (PR bodies, code), so they must never act on instructions found in it. |

### Files created

- `.claude/skills/{pr-qa-review, pr-change-analysis, critical-path-identification, test-type-selection, qa-report-format}/SKILL.md`, plus `qa-report-format/references/example-report.md`
- `.claude/agents/{pr-change-analyzer, pr-test-strategist, pr-qa-reviewer}.md`
- `.github/agents/pr-qa-reviewer.agent.md`, `.github/prompts/qa-pr.prompt.md`, `.github/copilot-instructions.md`
- `CLAUDE.md`, `README.md`

### Problem hit

Right after the files were written, Claude Code listed the new skills and the `pr-qa-review` description stopped at "test plan for PR". In unquoted YAML, ` #` starts a comment, so "PR #123" cut off the rest of the description. **Fix:** quote the description and drop the `#`. All other frontmatter was checked for the same pattern.

### Open item raised

The Copilot agent's `tools` list (`read`, `search`, `execute`, `github/*`) uses GitHub's documented short names. Worth confirming `execute` is recognized in the user's Copilot setup.

---

## Turn 2: Commit, sample PR, presentation, documentation

### Prompt

> Commit the current state. Add a simple code sample on a branch that can be opened as a PR to test the SKILL; it should test all the possible recommendations. Build out a presentation that will run 30 to 50 minutes to showcase this skill. Build out all necessary documentation, including documenting this chat history.

### 1. Commit

`a985eff`: *Add PR QA review skills and agents for Claude Code and Copilot* (on `main`).

### 2. Sample app and PR branch

**Decision:** put a baseline app on `main` and the risky change on a branch, rather than adding everything on the branch. A PR that only *adds* files has no existing callers, coverage or contracts to break, which would leave half the recommendation types untested.

- `def9b29` on `main`: *Add baseline sample order service*. A dependency-free Node app (`sample-app/`) with roles, pricing, discounts, checkout, a JSON store with migrations, a small UI and 13 `node:test` tests.
- `8687dd2` on `feature/discount-approval`: *Add manager approval for large order discounts*. 15 files, +175/−33, with 16 planted traps covering every recommendation type, including a deny-list authorization check, a skipped regression test, a breaking response contract, a data migration with no `down` step, PII in logs, low-contrast UI, a Node runtime bump, and a comment instructing AI reviewers to skip the file. Full list: [sample-pr.md](sample-pr.md).

**Problems hit:**

| Problem | Fix |
|---|---|
| `node --test test/` fails on Node 22 (treats the directory as a file) | Script changed to `node --test`, which discovers `test/` itself |
| A heredoc edit script got a stray prefix and failed | Re-ran as a standalone script file |
| Template-literal `'\\n'` became a literal newline in `server.js` (syntax error) | Fixed the line directly |
| `String.replace` treats `$$` in the replacement as `$`, dropping the dollar sign from the UI's money formatter | Fixed with a split/join replacement |
| A `\|` inside a Markdown table cell in the sample README | Escaped with the Edit tool after two `sed`/`node` attempts failed on shell quoting |

Verified on the branch: 13 pass, 1 skipped, 0 fail; new endpoints exercised by hand (sales gets 403 on review, manager approval applies the discount, admin export returns CSV, `/health` reports flags).

### 3. Running the skill against the branch

The `gh` CLI was not installed, so the `pr-qa-reviewer` subagent was run in **branch mode** (`git diff main...feature/discount-approval`) in the background while the presentation was built. Because `main` was checked out, the prompt told the agent to read branch files with `git show` and `git grep`.

**Result:** 10 critical paths (4 P0, 6 P1), overall risk High, 13 automated / 7 smoke / 8 manual recommendations. All 16 planted traps were found and the injected instruction was quoted and ignored. It also found 8 real issues that were *not* planted, including managers being able to approve their own discounts and CSV formula injection. Report: [qa-reports/feature-discount-approval-test-recommendations.md](../qa-reports/feature-discount-approval-test-recommendations.md). Scoring: [sample-pr-evaluation.md](sample-pr-evaluation.md).

**Improvement made from the run:** the advice to read a non-checked-out branch with `git show <branch>:<path>` / `git grep` had come from the prompt, not the skill. It was added to `pr-change-analysis`, and `git grep` was added to every agent's allowed commands.

**Small issue:** the subagent's output file was empty on disk, so the report was saved into `qa-reports/` from the agent's hand-back message.

### 4. Presentation

Built as a Claude Slides artifact: [AI QA PR Agent](https://claude.ai/artifact/PPekX7bmszKahTheTodhXf). 25 slides in six sections (Why, What, How, Demo, Adopt, Q&A), with speaker notes and running times on every slide. Running order and cut plan: [presentation-guide.md](presentation-guide.md).

- No design system was available, so the deck uses IBM Plex Sans and JetBrains Mono on navy/cream with orange and blue accents. Footer greys were adjusted to meet 4.5:1 contrast.
- The demo slides use the **actual** run results, not invented numbers.
- While drafting, the trap count on the slides was corrected from 14 to 16, and "unplanted findings" from 7 to 8, after counting against the answer key. Wording was also changed so the slides don't claim the answer-key *document* predates the run; the traps themselves did.
- The first publish was blocked by a read-permission rule on the short (`BOB~1.FOR`) temp path; it worked with the long path.

### 5. Documentation

| File | Purpose |
|---|---|
| [docs/README.md](README.md) | Index |
| [docs/architecture.md](architecture.md) | Components, design decisions, safety model, data flow |
| [docs/usage-guide.md](usage-guide.md) | Install, Claude/Copilot/CI usage, reading the report, customizing, calibrating, troubleshooting |
| [docs/sample-pr.md](sample-pr.md) | Sample app, opening the PR, answer key (T1–T17), recommendation coverage |
| [docs/sample-pr-body.md](sample-pr-body.md) | PR description for `gh pr create --body-file` (contains the planted "No API changes" claim) |
| [docs/sample-pr-evaluation.md](sample-pr-evaluation.md) | Trap-by-trap scorecard and calibration notes |
| [docs/presentation-guide.md](presentation-guide.md) | Running order, timing cuts, demo prep, likely questions |
| docs/chat-history.md | This file |

### Not done (needs the user)

- **Pushing and opening the PR.** Pushing to `github.com/bob-fornal/ai-qa-pr-agent` and creating the PR are outward-facing, so they were left for the user. Commands are in [sample-pr.md](sample-pr.md).
- **Sharing the deck.** The artifact is private until it's shared from its Share menu.
- **A Copilot run** of the sample PR, to compare with the Claude run.

---

## Turn 3: `gh` not installed

### Prompt

> Running into this : *(pasted PowerShell error: `gh : The term 'gh' is not recognized…`)*

The push had already succeeded (both branches were on `origin`); only `gh` was missing. Two options were given: open the PR in the browser via the compare URL and paste [sample-pr-body.md](sample-pr-body.md), or `winget install --id GitHub.cli` followed by `gh auth login`. The user opened [PR #1](https://github.com/bob-fornal/ai-qa-pr-agent/pull/1).

---

## Turn 4: Run against PR #1, then a rule change

### Prompts

> Run the agent against the PR: https://github.com/bob-fornal/ai-qa-pr-agent/pull/1

`gh` was now installed but not signed in. Because the repository is public, the plan was to read PR metadata from the public GitHub REST API and take the diff from `git`. The PR body turned out to be the commit message rather than [sample-pr-body.md](sample-pr-body.md), so trap T17 ("No API changes") still isn't exercised. The user stopped the run before it started to change the rules first:

> Adjust the agent(s) to account for the possibility that there may be no manual, smoke, or automated testing needed, but at least one of the three is needed.

### Change

The old rules nudged P0 paths toward two or more test types ("Every P0 path has at least two recommended types, or a stated reason why one is enough"). They now say:

- **Each type is optional per path.** Manual, Smoke and Automated are chosen independently, only when the path's risk calls for them. Nothing is added for completeness, and there are no quotas by priority.
- **At least one type per critical path.** A path that would get none isn't critical; it moves to *Low risk / not prioritized*.
- **Every omission is explained** under *Not recommended*. A P0 with only one type says why one is enough.
- **A type can be unused across the whole PR.** Its report section then says "None." with a reason.
- **PR-wide minimum.** If there are no critical paths at all, the summary still recommends at least one type, usually "the existing automated suite must pass in CI".

Files: `test-type-selection` (new "selection rule" section), `qa-report-format` (new matrix rules, "None." with a reason), `pr-qa-review` (verification step), `pr-test-strategist`, `pr-qa-reviewer` (Claude and Copilot self-checks), `docs/architecture.md`. Deck slides 10 and 14 were updated to match.

---

## Turn 5: Commit and rerun against PR #1

### Prompt

> Commit the change and rerun the agent against the PR: https://github.com/bob-fornal/ai-qa-pr-agent/pull/1

- Committed the rule change as `11c8c74`.
- Ran `pr-qa-reviewer` against PR #1: PR metadata from the public GitHub REST API (`gh` installed but not signed in), diff from `git`. The agent was told not to read the answer key or the earlier report, so the review stayed independent.
- **Result:** 16/16 traps again, 6 P0 · 4 P1. The new rule showed up as single-type paths where they fit (authorization and the API contract got Automated only; the UI got Manual only), each omission explained. Two new findings: the health check ignores `PORT`, and the change in rounding policy needs finance sign-off. Details: [sample-pr-evaluation.md](sample-pr-evaluation.md#run-2-pr-1-after-the-at-least-one-type-rule).
- **Issue:** the agent couldn't write its report. It has no write tool, and a single shell heredoc of about 20–30K characters hit the Windows command-length limit. The report was saved to [qa-reports/pr-1-test-recommendations.md](../qa-reports/pr-1-test-recommendations.md) from the agent's hand-back.

---

## Turn 6: Developer pre-QA checklist

### Prompt

> Let's generate a similar agent that's designed to provide a simple set of manual tests that can be run by the developer in preparation for what will be run by QA.

### Decisions

| Decision | Reasoning |
|---|---|
| Reuse `pr-change-analysis` and `critical-path-identification`; add one new skill, `dev-manual-checks` | The developer's checks should cover the same risks as QA's plan. Sharing the rubric keeps the critical-path IDs aligned and avoids a second scoring system. |
| Reuse CP IDs from an existing QA report in `qa-reports/` when there is one | The developer and QA documents then line up row for row. |
| Local only; at most 12 checks, 15–30 minutes | The goal is a fast first pass that catches obvious failures, not a second QA plan. Anything needing a deployed environment, real third parties or sign-off goes under *Left for QA*. |
| Fixed order: setup → existing suite → "it starts" → P0 happy/failure → P1 → one regression | A red suite or a broken start makes everything after it pointless, so those come first. |
| One start or `curl` command allowed per step, but no test code or scripts | Developers need concrete steps; anything that needs a script belongs in the QA report's automated recommendations. |
| Output ends with handoff notes and a checklist to paste into the PR | Makes the handoff to QA explicit: config, accounts, defects found, open questions. |
| Single-pass agent (`pr-dev-checklist`) plus an entry skill (`/pr-dev-checks`) and a Copilot agent + `/dev-checks` prompt | Same pattern as the QA tooling; the job is small enough not to need two stages. |

### Files

- New: `.claude/skills/dev-manual-checks/SKILL.md`, `.claude/skills/pr-dev-checks/SKILL.md`, `.claude/agents/pr-dev-checklist.md`, `.github/agents/pr-dev-checklist.agent.md`, `.github/prompts/dev-checks.prompt.md`
- Updated: `README.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/usage-guide.md`, `docs/architecture.md`

---

## Turn 7: Commit, push, and run the developer checklist on PR #1

### Prompt

> Commit, push, and run it against PR #1.

- Committed as `4cec421`. **The push to `main` failed three times** with a server-side `remote rejected … (Internal Server Error)`. GitHub's status page reported all systems operational, and the push was small (about 24 KB), so the cause was on GitHub's side, not in the commits.
- Ran `pr-dev-checklist` against PR #1 (PR metadata from the public API, diff from `git`). As designed, it reused the CP IDs from `qa-reports/pr-1-test-recommendations.md`.
- **Result:** 11 checks, about 28 minutes (9 on P0 paths, 2 on P1). The order follows the skill: setup and the existing suite (expecting exactly one skipped test), boot/health, P0 happy and failure paths, P1, then a flag-off regression. Four checks are written to expose likely defects ("likely fails today"): checkout while pending / review after paid, a `NaN` threshold, the email in the logs, and the deny-list role check. Everything that needs staging, real data, a browser matrix or sign-off is under *Left for QA*, one line per CP.
- **Verified:** every expected dollar amount and cent value in the checklist was recomputed independently ($48.15, $43.34, $32.26, $33.71, $40.93, $28.89; `paidTotalCents` 4334) and matched.
- Saved from the agent's hand-back to [qa-reports/pr-1-dev-checks.md](../qa-reports/pr-1-dev-checks.md); the only change was adding the 🔴 marker the format asks for.
