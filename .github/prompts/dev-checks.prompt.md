---
description: Short manual checklist for the PR author to run locally before handing off to QA. Recommendations only.
agent: pr-dev-checklist
argument-hint: PR number, PR URL, or branch (blank = current branch)
---

Produce the developer pre-QA checklist for ${input:target:PR number, URL, or branch (leave blank for current branch)}.

Follow the `pr-dev-checklist` agent instructions and the skills it references in `.claude/skills/`. Keep it to at most 12 locally runnable checks (15–30 minutes), each with concrete steps and an expected result. List anything that needs a deployed environment under *Left for QA*. Do not generate any test code.
