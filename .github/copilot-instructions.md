# Copilot instructions

This repository contains skills and agents that review pull requests and **recommend** what to test. They never generate code.

- Skills (shared with Claude Code) live in `.claude/skills/`. They are the source of truth for the rubric, decision rules, and report format.
- The Copilot custom agents are `.github/agents/pr-qa-reviewer.agent.md` (QA test plan) and `.github/agents/pr-dev-checklist.agent.md` (developer pre-QA checklist). The prompt files are `/qa-pr` and `/dev-checks` in `.github/prompts/`.
- When changing the review logic, edit the skill files rather than duplicating rules into agent files, so Claude and Copilot stay consistent.
