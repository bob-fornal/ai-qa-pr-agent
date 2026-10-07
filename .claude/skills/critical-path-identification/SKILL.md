---
name: critical-path-identification
description: Rubric for turning a PR change map into a ranked list of critical paths (user journeys, system flows, and contracts whose failure would materially hurt users, data, money, security, or operations). Use after change analysis when deciding what in a PR needs testing and how urgently.
user-invocable: false
---

# Critical Path Identification

A **critical path** is an end-to-end flow (user journey, system process, or contract) that this PR touches, **and** whose failure would cause material harm. The goal is to tell QA and developers *where to spend testing effort*, not to list every changed line.

Think in **flows**, not files. "Checkout with a saved card" is a critical path; `PaymentService.ts` is not.

## 1. Derive candidate paths

From the change map, build candidates by walking from each changed area up to its entry points:

- **User journeys**: a sequence a person performs (sign in, search, add to cart, submit form, export report).
- **System flows**: jobs, queues, webhooks, sync processes, scheduled tasks, data pipelines.
- **Contracts**: API request/response shapes, event schemas, DB schema, config/env contracts, shared library interfaces consumed by others.
- **Operational paths**: app startup, deployment, migrations, health checks, rollback, logging/alerting.

Merge candidates that share the same entry point and failure mode. Split a candidate if different parts carry different risk.

## 2. Check high-risk categories

Every one of these that the PR touches, even indirectly, must be considered as a candidate:

| Category | Examples of what to look for |
|---|---|
| Authentication & authorization | login, tokens, sessions, SSO, role/permission checks, guards, middleware, CORS |
| Money | pricing, billing, payments, refunds, invoices, tax, currency/rounding |
| Data integrity | writes, updates, deletes, migrations, transactions, idempotency, uniqueness, cascade rules |
| Security & privacy | PII handling, input validation, injection surfaces, secrets, encryption, logging of sensitive data, file upload |
| Public/shared contracts | API versioning, breaking response changes, event schemas, SDKs, shared packages |
| External integrations | third-party APIs, queues, email/SMS, webhooks, retries/timeouts |
| Configuration & flags | new env vars, changed defaults, feature-flag logic, per-environment differences |
| Dependencies & platform | framework/library upgrades, runtime version, build tooling, lockfile churn |
| Infrastructure & deployment | CI/CD, IaC, containers, networking, scaling, ordering between services |
| Concurrency & state | async flows, race conditions, caching/invalidation, locking, retries |
| Error handling & resilience | changed exception paths, fallbacks, timeouts, partial failure |
| Performance hot paths | high-traffic endpoints, N+1 queries, large loops, payload size |
| Core UI journeys | navigation, forms, primary CTAs, responsive layouts, accessibility, i18n |
| Compliance & audit | audit logs, retention, consent, regulatory reporting |
| Observability | metrics, logs, alerts, and tracing that operations depend on |

## 3. Score each candidate

Score **Impact** and **Likelihood** from 1 to 5 and multiply.

**Impact** (how bad if it breaks):
- 5: security breach, data loss/corruption, financial loss, legal/compliance exposure, full outage
- 4: core journey broken for many users; hard to roll back (migrations, external side effects)
- 3: important feature degraded, workaround exists, or limited user segment
- 2: minor feature or internal tool affected; easy rollback
- 1: cosmetic, no functional impact

**Likelihood** (how likely the PR broke it):
- 5: large or complex change directly in the path, no tests covering new behavior
- 4: direct change with partial coverage, or change in shared/cross-cutting code the path depends on
- 3: moderate change, some coverage; or indirect dependency with confirmed consumers
- 2: small, well-covered change; or indirect dependency with likely consumers
- 1: trivial change, strong coverage, or only an unknown/theoretical link

Raise likelihood by one level (max 5) for any of: deleted/skipped tests, concurrency, date/time/timezone/locale logic, floating-point money math, regex/parsing changes, dependency major-version bumps, or a mismatch between stated intent and diff.

**Risk = Impact × Likelihood**

| Score | Priority | Meaning |
|---|---|---|
| 15–25 | **P0 – Critical** | Must be tested before merge/release; blocks sign-off |
| 8–14 | **P1 – High** | Should be tested before release |
| 4–7 | **P2 – Medium** | Test if time allows, or rely on existing automation |
| 1–3 | **P3 – Low** | Note only; no dedicated testing recommended |

Any Impact-5 path is at least **P1**, regardless of likelihood.

## 4. Describe each critical path

For every P0–P2 path, capture:

- **ID**: `CP-1`, `CP-2`, … ordered by risk score (highest first)
- **Name**: short flow name in business language
- **Entry point(s)**: route, endpoint, job, or event
- **What changed in this path**: tie it back to specific files/symbols
- **Why it's critical**: the failure mode and who or what is harmed
- **Impact / Likelihood / Score / Priority**
- **Existing coverage**: what is already tested, and the gap
- **Key scenarios**: happy path, important negative cases, edge and boundary cases, permission variations, and data states (empty, large, legacy, malformed)
- **Preconditions/test data**: accounts, roles, flags, seed data, environment

P3 items go in a single "Low risk / not prioritized" list with a one-line reason each.

## Guardrails

- Every critical path must be traceable to evidence in the diff or change map. Don't invent flows the PR can't reach.
- When a link is **unknown** (for example external consumers of an API), say so and put the question in *Open Questions* instead of silently inflating or ignoring risk.
- Prefer 3–10 well-justified critical paths over a long undifferentiated list. If there are more than 10 P0/P1 paths, flag that the PR may be too large to test safely and suggest splitting.
