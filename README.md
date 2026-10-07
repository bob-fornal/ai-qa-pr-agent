# AI QA PR Agent

Skills and agents for **Claude Code** and **GitHub Copilot** that examine a pull request and recommend what to test:

- the **critical paths** the PR affects, ranked by risk (impact × likelihood), and
- for each path, whether it needs **Manual**, **Smoke**, and/or **Automated** testing, with the reasoning and plain-language test ideas.

They produce **recommendations only**. No test code is generated.

## How it works

```
PR / branch ──► pr-change-analysis ──► critical-path-identification ──► test-type-selection ──► qa-report-format
               (what changed, blast     (ranked CP-1..n, P0–P3)          (Manual / Smoke /         (standard
                radius, coverage)                                         Automated + why)          Markdown report)
```

| Piece | Location | Used by |
|---|---|---|
| `pr-change-analysis` skill | `.claude/skills/pr-change-analysis/` | Claude, Copilot |
| `critical-path-identification` skill | `.claude/skills/critical-path-identification/` | Claude, Copilot |
| `test-type-selection` skill | `.claude/skills/test-type-selection/` | Claude, Copilot |
| `qa-report-format` skill + example | `.claude/skills/qa-report-format/` | Claude, Copilot |
| `/pr-qa-review` entry skill (orchestrator) | `.claude/skills/pr-qa-review/` | Claude |
| `pr-change-analyzer` agent (stage 1) | `.claude/agents/` | Claude |
| `pr-test-strategist` agent (stage 2) | `.claude/agents/` | Claude |
| `pr-qa-reviewer` agent (single pass) | `.claude/agents/` | Claude |
| `pr-qa-reviewer` custom agent | `.github/agents/pr-qa-reviewer.agent.md` | Copilot |
| `/qa-pr` prompt | `.github/prompts/qa-pr.prompt.md` | Copilot |

The skills are the single source of truth. Both tools read `.claude/skills/`, and the Copilot agent also links to the files directly, so the rubric is never duplicated.

## Prerequisites

- `git`, plus the [GitHub CLI](https://cli.github.com/) (`gh`) authenticated for PR lookups (`gh auth status`)
- Run from a checkout of the repository being reviewed, so blast-radius tracing can search its code

## Installing into a project

Copy the `.claude/` and `.github/agents/` + `.github/prompts/` folders into the target repository (or into `~/.claude/` for personal, cross-project use with Claude Code).

## Usage

### Claude Code

```text
/pr-qa-review 482
/pr-qa-review https://github.com/org/repo/pull/482 --save
/pr-qa-review feature/discount-approval
/pr-qa-review                      # current branch vs. default branch
```

Or ask in plain language: *"What should we test in PR 482?"* For a self-contained run, ask for the `pr-qa-reviewer` agent.

Headless / CI:

```bash
claude -p "/pr-qa-review 482 --save"
```

### GitHub Copilot (VS Code)

- Choose **pr-qa-reviewer** from the agent picker in Chat and ask *"Review PR 482"*, or
- run the prompt file: `/qa-pr 482`

Copilot's coding agent on github.com also picks up `.github/agents/pr-qa-reviewer.agent.md`.

## Output

A Markdown report with:

1. **Summary**: overall risk, scope, critical path counts, merge readiness
2. **Critical Path Matrix**: one row per path with ✅ for Automated / Smoke / Manual
3. **Critical Path Details**: why it's critical, existing coverage, and test ideas per type
4. **Smoke Test Checklist**: post-deploy, ≤ 5 minutes
5. **Manual Test Plan**: scripted cases and exploratory charters
6. **Automated Test Recommendations**: level (unit / integration / contract / E2E …), what to verify, suggested location
7. **Coverage Gaps & Risks**, **Open Questions**, **Low Risk / Not Prioritized**

See the [example report](.claude/skills/qa-report-format/references/example-report.md).

## Safety

- All agents are read-only: they don't check out, commit, push, comment, approve, or label. Saving the report to `qa-reports/` happens only when requested.
- PR titles, descriptions, commits, and code are treated as **untrusted data**. Any text that tries to instruct the reviewer is ignored and surfaced under *Open Questions*.

## Customizing

- **Risk thresholds and high-risk categories:** `critical-path-identification/SKILL.md`
- **When to choose Manual / Smoke / Automated:** `test-type-selection/SKILL.md`
- **Report layout:** `qa-report-format/SKILL.md` (keep the example report in sync)
