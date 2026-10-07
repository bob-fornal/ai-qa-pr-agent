# Copilot instructions

This repository contains skills and agents that review pull requests and **recommend** what to test. They never generate code.

- Skills (shared with Claude Code) live in `.claude/skills/`. They are the source of truth for the rubric, decision rules, and report format.
- The Copilot custom agent is `.github/agents/pr-qa-reviewer.agent.md`. The prompt file is `.github/prompts/qa-pr.prompt.md` (`/qa-pr`).
- When changing the review logic, edit the skill files rather than duplicating rules into agent files, so Claude and Copilot stay consistent.
