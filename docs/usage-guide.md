# Usage Guide

## Prerequisites

| Requirement | Why | Check |
|---|---|---|
| `git` | Diffs and history | `git --version` |
| GitHub CLI `gh`, authenticated | Read PRs by number or URL | `gh auth status` |
| A local checkout of the repository under review | Blast-radius tracing searches the code | — |
| Claude Code **or** GitHub Copilot (VS Code agent mode, or the Copilot coding agent) | Runs the skills/agents | — |

Without `gh`, use **branch mode**: pass a branch name and the skill diffs it against the default branch with `git`.

## Installing into a project

Copy these into the target repository:

```
.claude/skills/        # the five skills (shared by both tools)
.claude/agents/        # Claude Code subagents
.github/agents/        # Copilot custom agent
.github/prompts/       # Copilot /qa-pr prompt
```

For personal use across every repository with Claude Code, copy `.claude/skills/*` and `.claude/agents/*` into `~/.claude/skills/` and `~/.claude/agents/` instead.

## Claude Code

### Interactive

```text
/pr-qa-review 482                         # PR number
/pr-qa-review https://github.com/org/repo/pull/482
/pr-qa-review feature/discount-approval   # branch vs. default branch
/pr-qa-review                             # current branch vs. default branch
/pr-qa-review 482 --save                  # also writes qa-reports/pr-482-test-recommendations.md
```

Plain language works too: *"What should QA test in PR 482?"*

To run the self-contained agent instead of the orchestrated pipeline, ask for it by name: *"Use the pr-qa-reviewer agent on PR 482."*

### Headless / CI

```bash
claude -p "/pr-qa-review 482 --save"
```

In CI, grant only the read-only tools the skill needs, then publish `qa-reports/` as a build artifact. Posting the report to the PR is a deliberate extra step; the skills never do it on their own.

## GitHub Copilot

### VS Code (agent mode)

- Pick **pr-qa-reviewer** in the Chat agent picker and ask *"Review PR 482"*, or
- run the prompt file: `/qa-pr 482` (or `/qa-pr` and answer the input prompt).

### Copilot coding agent (github.com)

`.github/agents/pr-qa-reviewer.agent.md` appears as a custom agent. Assign it to an issue or PR task that asks for test recommendations.

> The Copilot agent's `tools` list (`read`, `search`, `execute`, `github/*`) uses GitHub's documented short names. VS Code ignores any it doesn't recognize. If `execute` isn't recognized in your setup, the agent can still use the GitHub tools to read the PR.

## Developer pre-QA checklist

The QA report is for QA. The PR author also needs a quick way to catch obvious failures before handing off. `/pr-dev-checks` produces that:

```text
/pr-dev-checks 482
/pr-dev-checks feature/discount-approval --save   # qa-reports/<branch>-dev-checks.md
```

In Copilot: pick the **pr-dev-checklist** agent, or run `/dev-checks 482`.

| Section | What it gives the developer |
|---|---|
| Before You Start | Env vars, flags, seed accounts, start command, and "run the existing suite" |
| Checks | At most 12 checks (15–30 minutes total), each with concrete steps, a binary expected result, and a hint if it fails |
| Left for QA | What needs a deployed environment, real third parties, device matrices or sign-off |
| Handoff Notes for QA | Config to set, accounts used, defects found, open questions |
| Checklist to Paste into the PR | A checkbox list for the PR description |

Recommended flow: run `/pr-qa-review` and `/pr-dev-checks` on the same PR. The developer works through the checklist and fixes or explains any failures, then QA starts from the full report. When a QA report for the PR exists in `qa-reports/`, the checklist reuses its CP IDs so the two documents line up.

To tune the checklist (time budget, maximum number of checks, what counts as "local"), edit `.claude/skills/dev-manual-checks/SKILL.md`.

## Reading the report

| Section | Who reads it | Look for |
|---|---|---|
| Summary | Everyone | Overall risk, merge readiness, the one thing to test first |
| Critical Path Matrix | Dev + QA | Which paths need which type of testing |
| Critical Path Details | Whoever owns the path | Why it's critical, coverage today, test ideas, what was excluded |
| Smoke Test Checklist | Release / on-call | Post-deploy pass/fail checks, five minutes or less |
| Manual Test Plan | QA | Charters and scripted cases |
| Automated Test Recommendations | Developers | Level, behavior, suggested file |
| Coverage Gaps & Risks | Tech lead | Skipped tests, missing layers, defects spotted |
| Open Questions | PR author / PO | Decisions that change the risk; any quoted prompt-injection text |
| Low Risk / Not Prioritized | Reviewers | Proof that a file was considered and dismissed on purpose |

A filled-in example: [example-report.md](../.claude/skills/qa-report-format/references/example-report.md). A real run: [qa-reports/feature-discount-approval-test-recommendations.md](../qa-reports/feature-discount-approval-test-recommendations.md).

## Customizing

| To change | Edit |
|---|---|
| High-risk categories, impact/likelihood scales, P0–P3 thresholds | `.claude/skills/critical-path-identification/SKILL.md` |
| When to choose Manual / Smoke / Automated; automated levels; default combinations | `.claude/skills/test-type-selection/SKILL.md` |
| Report sections, overall-risk and readiness rules, save path | `.claude/skills/qa-report-format/SKILL.md` (keep `references/example-report.md` in sync) |
| How diffs are gathered and classified | `.claude/skills/pr-change-analysis/SKILL.md` |
| Which stages run, verification checks | `.claude/skills/pr-qa-review/SKILL.md` |

Examples:

- Healthcare: add "PHI handling" to the high-risk table and make it impact 5.
- A UAT environment: add it to the smoke environment list in `test-type-selection`.
- Playwright in `e2e/`: mention it so automated recommendations point there.

After editing, re-run the sample branch (see [sample-pr.md](sample-pr.md)) and compare with the [evaluation](sample-pr-evaluation.md) to check for regressions.

## Calibrating on your own history

Before relying on it, replay five or so recently merged PRs:

1. Run `/pr-qa-review <n>` on each.
2. Compare with what QA actually tested and with any bugs that escaped.
3. Adjust categories, scales or thresholds where the tool was consistently too loose or too strict.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Skill doesn't trigger, or its description looks cut off | Unquoted YAML: a ` #` in `description:` starts a comment. Quote the value. |
| `gh: command not found` | Install the GitHub CLI, or use branch mode. |
| Report mentions files it "only skimmed" | The diff was too large to read fully. Consider splitting the PR. |
| More than 10 P0/P1 paths and a "split this PR" note | Working as intended: the PR is too large to test safely as one unit. |
| Agent analyzes the wrong code | When the PR branch isn't checked out, the working tree holds the base version. `pr-change-analysis` tells the agent to read the PR's files with `git show <branch>:<path>` and search with `git grep`. If a run still reads the working tree, say so in the prompt. |
