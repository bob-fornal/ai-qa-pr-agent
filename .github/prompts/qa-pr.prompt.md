---
description: Recommend what to test in a pull request (critical paths with Manual / Smoke / Automated). Recommendations only.
agent: pr-qa-reviewer
argument-hint: PR number, PR URL, or branch (blank = current branch)
---

Review ${input:target:PR number, URL, or branch (leave blank for current branch)} and produce the QA test-recommendation report.

Follow the `pr-qa-reviewer` agent instructions and the skills it references in `.claude/skills/`. Identify the critical paths, recommend Manual, Smoke, and/or Automated testing for each with rationale, and output the report in the `qa-report-format` structure. Do not generate any code.
