---
name: test-type-selection
description: Decision rules for choosing Manual, Smoke, and/or Automated testing (and the automated test level) for each critical path in a PR, with justification. Use after critical paths are identified. Produces recommendations only; never writes test code.
user-invocable: false
---

# Test Type Selection

For each critical path, decide **independently** whether it needs **Manual**, **Smoke**, and/or **Automated** testing, and justify each choice.

## The selection rule

- **Each type is optional.** Any one, any two, or all three may apply. Recommend a type only when the path's risk calls for it. Never add one for completeness or to make the matrix look balanced.
- **At least one type is required.** Every critical path (P0–P2) gets at least one recommended type. A path that seems to need none isn't a critical path: move it to "Low risk / not prioritized" with a reason.
- **Every exclusion is explained.** Each type *not* recommended for a path gets a one-line reason under **Not recommended** (for example "Manual: deterministic logic, fully covered by unit tests").
- **No priority quotas.** A P0 path does not automatically need two or three types; one well-chosen type can be enough. If a P0 path gets only one type, state why that one is sufficient.
- **Report-wide minimum.** Even when every change is low risk (P3) and there are no critical paths, recommend at least one type for the PR as a whole. Usually that's **Automated: the existing suite must pass in CI**. State it in the summary. Don't invent a critical path to hold it.

Combinations are still common. A P0 path often needs automated regression coverage *and* a smoke check after deploy, but only when each one covers a risk the other doesn't.

## Definitions (use these consistently)

| Type | What it means here | When it runs |
|---|---|---|
| **Automated** | Repeatable tests in the codebase that run in CI (unit, integration, contract, component, E2E, performance) | Every build/PR, nightly |
| **Smoke** | A small, fast, shallow set of checks that confirm the critical path *works at all* in a deployed environment. Can be scripted or a short manual checklist | After each deploy to an environment (QA, staging, prod), before deeper testing |
| **Manual** | A human executes scripted cases or exploratory charters that need judgment, observation, or access automation can't easily get | Before release, during QA cycle |

## Decision rules

### Recommend **Automated** when the path has any of:
- Deterministic logic with clear expected outputs (calculations, validation, mapping, state transitions)
- A bug fix: always recommend a regression test that fails without the fix
- Contract or schema changes (API, events, DB): recommend contract/integration tests
- Permission/role matrices, which are combinatorial and tedious for humans
- High change frequency or shared code, where regressions are likely to recur
- Data migrations: recommend tests of the migration against representative data, plus rollback where supported
- Edge/boundary cases that are easy to miss manually (nulls, limits, time zones, rounding, concurrency)

Then choose the **lowest level that gives confidence**:

| Level | Use for |
|---|---|
| Unit | Pure logic, branching, calculations, validators, mappers |
| Integration | Code + real DB/queue/file system, repository queries, transactions, DI wiring, middleware |
| Contract | API/event shape agreements between services or with consumers |
| Component/UI | Rendering, state, and interaction of a UI component in isolation |
| E2E | Only for the few highest-value journeys that cross many layers; they're slow and brittle, so use them sparingly |
| Performance/load | Hot paths where the change could affect latency, throughput, or memory |
| Security (SAST/DAST/dependency scan) | Auth, input handling, dependency upgrades |

Fit the recommendation to the test layers and frameworks the repo already uses (from the change map). If a needed layer doesn't exist (for example there are no integration tests), say so as a gap rather than assuming it.

### Recommend **Smoke** when the path:
- Is a **P0** path that must work immediately after deploy (login, home/landing, primary transaction, core API health)
- Depends on **environment-specific** things automation can't fully verify pre-deploy: config, secrets, env vars, feature flags, infrastructure, DNS/routing, certificates, third-party credentials
- Involves **dependency, framework, runtime, or build changes** (the app might not start, or bundles might break)
- Involves **migrations** (app boots against the migrated schema; key reads/writes still work)
- Touches **external integrations** reachable only in deployed environments
- Is something a **rollback decision** would be based on

Smoke items must be quick (≤ 5 minutes total per environment is a good target), shallow, and binary (pass/fail). Specify which environment(s) they apply to.

### Recommend **Manual** when the path needs:
- **Visual/UX judgment**: layout, responsiveness, copy, look and feel, animations
- **Accessibility** verification beyond automated linting (screen reader, keyboard navigation, focus order)
- **Exploratory testing** of new or significantly changed features, ambiguous requirements, or complex state
- **Cross-browser/device** checks where no device farm is automated
- **Third-party or external systems** with no sandbox/test mode, or that need a human (email received, SMS, PDF rendering, printed output)
- **One-time operations** where building automation isn't worth it (one-off data backfill verification) — still recommend a written checklist
- **Business acceptance** against acceptance criteria by a product owner/stakeholder

For manual testing, prefer **charters** ("Explore <area> with <resources> to discover <risks>") for exploratory work, and short scripted steps only where precision matters.

## Combining types: common patterns

| Situation | Typical recommendation |
|---|---|
| New business rule in a service | Automated (unit) + Automated (integration if persisted) |
| Bug fix | Automated regression test at the level where the bug lived; Manual verification of the original repro steps |
| New UI feature | Automated (component) for logic/state + Manual exploratory/UX/a11y + Smoke if it's on a core journey |
| Auth/permission change | Automated (role matrix at unit/integration) + Smoke (login + one protected action per env) + Manual (negative/abuse cases) |
| API contract change | Automated (contract + integration) + Smoke (endpoint health in each env); Manual only if consumers are external and untestable |
| DB migration | Automated (migration against representative data) + Smoke (app boots, key reads/writes post-migrate) + Manual (data spot-check in staging) |
| Dependency/framework upgrade | Automated (full existing suite must pass) + Smoke (startup + core journeys) + Manual exploratory around areas the upgrade touches |
| Config/feature-flag change | Smoke (each environment, flag on and off where relevant) + Automated (flag-branch logic) |
| CI/CD or infrastructure change | Smoke (deploy succeeds, health checks, rollback works) + Manual review of pipeline run |
| Copy/styling only | Manual visual check; Automated visual regression only if the repo already has it |

## Output per critical path

For each `CP-n`, produce:

- **Recommended types:** `Automated (unit, integration)` · `Smoke (staging, prod)` · `Manual (exploratory)`, listing only the ones that apply (at least one, at most three)
- **Rationale:** one or two sentences per type explaining *why this type* for *this risk*
- **What to verify:** test ideas written as behavior ("Given a user without the `billing:write` role, when they POST /invoices, then 403 and no invoice is created"). Describe them; **do not write test code**.
- **Existing tests to update or re-run:** by file/name, if known
- **Not recommended:** every type (Manual, Smoke, Automated) that was excluded, and why. Also note any automated level deliberately skipped (for example "E2E not recommended: covered by integration and smoke; E2E would be flaky against the payment sandbox"). Omit this line only when all three types are recommended.

## Guardrails

- Never output test code, scripts, or fixtures. Describe tests in plain language (Given/When/Then is fine).
- Don't recommend a type without a reason tied to the path's risk, and don't leave a critical path with no type at all.
- It's fine for one type to be unused across the whole PR (for example no Smoke checks for a library with no deployment). Say so in the report rather than forcing an item.
- Don't recommend Automated E2E by default. Justify it against lower-level alternatives.
- If the PR already adds adequate tests for a path, say so and recommend only what's missing.
