# AI QA PR Agent

Skills and agents that review a pull request and **recommend** what to test (critical paths, plus Manual / Smoke / Automated per path), and give the PR author a short pre-QA manual checklist (`/pr-dev-checks`). They never generate code.

- Skills in `.claude/skills/` are the single source of truth. Copilot reads the same files, so don't duplicate rules into agent definitions.
- Claude Code agents are in `.claude/agents/`. The Copilot agent and prompt are in `.github/agents/` and `.github/prompts/`.
- Keep `qa-report-format` and its example report in sync when changing the report structure.
