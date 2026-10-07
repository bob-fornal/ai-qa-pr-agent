# Architecture

This document explains how the PR QA review tooling is put together, and why.

## Goal

Given a pull request, produce:

1. the **critical paths** it affects (flows, not files), ranked by risk, and
2. for each path, whether it needs **Manual**, **Smoke** and/or **Automated** testing, with the reasons.

The output is **recommendations only**. Nothing in this repository generates test code.

## Components

```
                        ┌──────────────────────────── .claude/skills/ (single source of truth) ───────────────────────────┐
                        │ pr-change-analysis │ critical-path-identification │ test-type-selection │ qa-report-format (+example)│
                        └─────────▲────────────────────────▲─────────────────────────▲──────────────────────▲───────────────┘
                                  │ preloaded / linked     │                         │                      │
 Claude Code                      │                        │                         │                      │
  /pr-qa-review ──► pr-change-analyzer ──Change Map──► pr-test-strategist ──paths+types──► orchestrator verifies + formats
  (entry skill)       (subagent)                           (subagent)

  pr-qa-reviewer (single-pass subagent: all four skills, for headless/CI use)

 GitHub Copilot
  /qa-pr (prompt file) ──► pr-qa-reviewer.agent.md (custom agent; links to the four skill files)
```

| Component | File | Role |
|---|---|---|
| Entry skill | `.claude/skills/pr-qa-review/SKILL.md` | User-invocable `/pr-qa-review`. Orchestrates the two subagents, verifies the result, formats and optionally saves it |
| Change analysis skill | `.claude/skills/pr-change-analysis/SKILL.md` | Resolves the input (PR number/URL, branch, current branch), sorts files into 13 categories, traces callers to entry points, inventories test coverage |
| Critical path skill | `.claude/skills/critical-path-identification/SKILL.md` | 15 high-risk categories, impact × likelihood scoring, P0–P3 thresholds, path description template |
| Test type skill | `.claude/skills/test-type-selection/SKILL.md` | Definitions and decision rules for Manual / Smoke / Automated, automated level selection, common combinations |
| Report format skill | `.claude/skills/qa-report-format/SKILL.md` | Fixed report structure, overall-risk and merge-readiness rules, save location |
| Stage 1 agent | `.claude/agents/pr-change-analyzer.md` | Read-only; returns the Change Map |
| Stage 2 agent | `.claude/agents/pr-test-strategist.md` | Turns the Change Map into ranked paths and test-type recommendations |
| Single-pass agent | `.claude/agents/pr-qa-reviewer.md` | All four stages in one context; best for headless runs |
| Copilot agent | `.github/agents/pr-qa-reviewer.agent.md` | Same workflow for Copilot; links to the skill files |
| Copilot prompt | `.github/prompts/qa-pr.prompt.md` | `/qa-pr <target>` shortcut that selects the agent |
| Dev checklist skill | `.claude/skills/dev-manual-checks/SKILL.md` | Rules and format for the developer pre-QA checklist: local only, at most 12 checks, 15–30 minutes, aligned CP IDs |
| Dev checklist entry skill | `.claude/skills/pr-dev-checks/SKILL.md` | User-invocable `/pr-dev-checks`; delegates, verifies, optionally saves |
| Dev checklist agent | `.claude/agents/pr-dev-checklist.md` / `.github/agents/pr-dev-checklist.agent.md` | Single-pass: change analysis → critical paths → developer checks (Claude / Copilot) |
| Dev checklist prompt | `.github/prompts/dev-checks.prompt.md` | `/dev-checks <target>` for Copilot |

## Two audiences, one rubric

```
                     pr-change-analysis ──► critical-path-identification ──┬──► test-type-selection ──► qa-report-format   (QA: full plan)
                                                                            └──► dev-manual-checks                           (developer: 15–30 min local pass)
```

Both outputs share the change analysis and the critical-path ranking, so the developer's checks and QA's plan use the same CP IDs. The developer checklist is deliberately shallow and local: it catches "doesn't start / happy path broken / wrong role" before QA spends time, and hands everything environment-specific to QA.

## Design decisions

### Rules live in skills; agents stay thin

Every rubric, threshold and format rule is in a skill file. Agents only say *which* skills to follow and *which* tools they may use. Claude Code and Copilot both read `.claude/skills/`, and the Copilot agent also links to the files directly. So a change to the scoring reaches both tools at once and the two can't drift apart.

### Two stages in Claude Code

Claude Code's orchestrator gives change analysis and test strategy to separate subagents:

- The analyzer reads diffs and searches the codebase. That is token-heavy, and its context fills with raw code.
- The strategist gets only the structured Change Map, so its context holds the evidence and none of the noise.
- The orchestrator keeps a clean context for verification: high-risk categories covered, every path has at least one test type (each omitted type explained), bug fixes have regression tests, no code.

Subagents can't spawn subagents, so orchestration lives in the **skill** (which runs in the main conversation), not in an agent. The single-pass `pr-qa-reviewer` exists for places where one agent is simpler, such as CI or the Copilot side.

### Flows, not files

Paths are named in business language ("Checkout total with discount"), and every path must trace to evidence in the diff. Asking for 3–10 paths, with a warning when there are more than 10 P0/P1, forces the agent to rank instead of listing everything.

### Explicit, arguable scoring

Impact (1–5) × Likelihood (1–5), with named modifiers (skipped tests, money math, time zones, intent/diff mismatch…). Scores can differ by a level between runs. Showing the arithmetic lets a reviewer see *why* and disagree with a specific input rather than with a verdict.

### Recommendations, not code

The scarce skill is deciding *what* deserves testing and *how*. A ranked plan is quick to review. Read-only agents are safe on any PR. Given/When/Then test ideas can feed a separate code-writing step if a team wants one.

## Safety model

- **Read-only tools.** The entry skill's `allowed-tools` limits Bash to `gh pr view/diff`, `gh repo view` and read-only `git` subcommands. The Copilot agent has no `edit` tool. Saving the report to `qa-reports/` happens only on `--save` or an explicit request.
- **Untrusted input.** PR titles, bodies, commits, comments and code are treated as data. Any text aimed at an AI reviewer is quoted under *Open Questions* and otherwise ignored. The sample PR plants exactly such a comment to check this.
- **No outward actions.** Posting to a PR or any external system requires an explicit request in the current session.

## Data flow for one run

1. **Input:** PR number/URL → `gh pr view` + `gh pr diff`; branch → `git diff origin/<base>...<branch>`; nothing → current branch vs. default.
2. **Change Map:** files × category × behavioral summary, changed symbols → consumers (confirmed / likely / unknown) → entry points, cross-cutting changes, coverage, deployment notes, unknowns.
3. **Critical paths:** candidates from entry points plus the high-risk checklist, scored, described (CP-1…CP-n).
4. **Test types:** per path, which of Automated (level), Smoke (environments) and Manual (scripted/exploratory) apply, with rationale, plus what was deliberately not recommended.
5. **Report:** the `qa-report-format` structure; overall risk and merge readiness follow fixed rules.
