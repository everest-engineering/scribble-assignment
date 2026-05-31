<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- PRINCIPLE_1_NAME -> I. HTTP Polling Only
- PRINCIPLE_2_NAME -> II. In-Memory Room State
- PRINCIPLE_3_NAME -> III. TypeScript and Zod Contracts
- PRINCIPLE_4_NAME -> IV. Scenario-Traceable Delivery
- PRINCIPLE_5_NAME -> V. Incremental AI-Assisted Review
Added sections:
- Assignment Scope Boundaries
- Development Workflow and Quality Gates
Removed sections:
- Placeholder template sections
Templates requiring updates:
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/tasks-template.md
- reviewed: .specify/templates/commands/*.md (directory absent; no files to update)
- reviewed: README.md and AGENTS.md; no constitution-specific edits required
Follow-up TODOs: None
-->
# Scribble Constitution

## Core Principles

### I. HTTP Polling Only
All multiplayer synchronization MUST use REST endpoints and frontend polling. WebSockets,
Socket.io, Server-Sent Events, long polling, and any other push protocol are prohibited.
Polling cadence MUST be explicit in specs and plans, with lobby and gameplay refreshes
targeting approximately two seconds unless a feature artifact justifies a different value.

Rationale: The assignment evaluates disciplined HTTP state synchronization in a bounded
starter app, not real-time infrastructure.

### II. In-Memory Room State
All game data MUST remain in process memory inside the backend. Rooms MUST be isolated by
code, and inactive or reset room state MUST be removed or cleared deliberately. Databases,
file persistence, browser storage as source of truth, queues, caches, and external state
services are prohibited.

Rationale: Keeping state ephemeral makes the room lifecycle, restart behavior, and edge
cases reviewable without hidden persistence.

### III. TypeScript and Zod Contracts
Backend and frontend code MUST be TypeScript-first, fully typed, and implemented as ES
Modules. Request payloads, route parameters, and response shapes that cross the API
boundary MUST be validated with Zod on the backend. New dynamic data MUST use `unknown`
until narrowed; `any` is prohibited unless a third-party type forces it and the usage is
locally justified.

Rationale: The game depends on shared state snapshots; typed and validated contracts keep
polling clients from crashing or silently diverging.

### IV. Scenario-Traceable Delivery
Every specification, plan, and task set MUST map work to the four assignment scenarios:
room setup and lobby, game start and drawer flow, gameplay interaction, and result/restart.
Features MUST define acceptance criteria for valid paths and edge cases before
implementation. Work outside the README scope is prohibited unless the constitution is
amended first.

Rationale: Traceability keeps the brownfield enhancement focused and makes the final pull
request easy to assess.

### V. Incremental AI-Assisted Review
AI-assisted changes MUST be small enough to review, tied to Spec Kit artifacts, and
validated before handoff. Each implementation slice MUST include an explicit verification
step: automated tests where practical, plus two-browser manual validation for multiplayer
flows. Generated code MUST be inspected for scope creep, banned technologies, unnecessary
dependencies, and unhandled API failures.

Rationale: The lab grades reasoning and review discipline as much as working behavior.

## Assignment Scope Boundaries

The product is a two-app monorepo: an Express backend and a Vite React frontend. Backend
code lives under `backend/src/api`, `backend/src/services`, and `backend/src/models`.
Frontend UI, routing, services, and state live under `frontend/src` using React 18 and
React Router v6 patterns. Styling belongs in existing CSS structure unless a component
module is already established.

The following are non-negotiable exclusions: authentication, sessions, JWT, OAuth,
databases, persistent storage, WebSockets, deployment, Docker, CI, spectator mode,
moderation, invite links, room passwords, custom word packs, timers, multiple rounds,
drawer rotation, speed bonuses, drawer bonuses, and rewriting the starter from scratch.
New top-level dependencies require a plan-level justification showing why existing
frameworks cannot satisfy the scenario.

## Development Workflow and Quality Gates

Discovery MUST precede design changes and list concrete gaps, assumptions, and relevant
files. Specifications MUST include acceptance criteria, edge cases, assumptions, and
measurable outcomes for each scenario group. Plans MUST document the backend state model,
frontend polling/data flow, endpoint changes, file-level impact, and risk mitigation.
Tasks MUST be ordered so each scenario can be implemented and verified independently.

Before handoff, run the relevant build and test commands for touched apps. For complete
assignment handoff, both `cd backend && npm run build` and
`cd frontend && npm run build` MUST pass, and multiplayer behavior MUST be checked in two
browser tabs. Any skipped validation MUST be recorded with the reason and residual risk.

## Governance

This constitution supersedes conflicting guidance in specs, plans, tasks, and generated AI
output. Amendments require a documented reason, a semantic version bump, a sync impact
report, and updates to affected Spec Kit templates or runtime guidance.

Versioning follows semantic rules: MAJOR for removing or redefining principles in a way
that changes prior decisions, MINOR for adding principles or materially expanding
governance, and PATCH for wording clarifications that do not change obligations.

Compliance is reviewed at every Spec Kit phase. `/speckit-plan` MUST pass the Constitution
Check before design work proceeds, `/speckit-tasks` MUST create traceable verification
tasks, and implementation review MUST reject banned technologies, unvalidated API
contracts, untyped state, and scope outside the assignment.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
