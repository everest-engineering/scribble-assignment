<!--
Sync Impact Report
Version change: template → 1.0.0
Modified principles:
- Placeholder Principle 1 → I. TypeScript First, Strict by Default
- Placeholder Principle 2 → II. Preserve the Existing Stack
- Placeholder Principle 3 → III. HTTP and In-Memory Only
- Placeholder Principle 4 → IV. Extend, Do Not Rewrite
- Placeholder Principle 5 → V. Test the Edge Cases
Added sections:
- Additional Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ `.specify/templates/plan-template.md` updated to align the Constitution Check with the repo rules
- ✅ `.specify/templates/tasks-template.md` updated to reinforce edge-case testing guidance
- ⚠ `.specify/templates/spec-template.md` reviewed; no structural change was required
- ⚠ `.specify/templates/commands/` does not exist in this repo, so no command-file updates were needed
Deferred items:
- TODO(RATIFICATION_DATE): original adoption date was not recorded in the starter
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First, Strict by Default
All new and changed code MUST be fully typed in TypeScript. Avoid `any`; use
`unknown` when a value is genuinely dynamic and narrow it immediately at the
boundary. New code MUST respect the existing strict compiler settings in
`backend/tsconfig.json` and `frontend/tsconfig.json`; do not weaken the type
system to make code compile.

### II. Preserve the Existing Stack
The repository MUST stay aligned with the current stack: Node.js, Express,
Zod, `tsx`, and Vitest on the backend; React 18, React Router v6, Vite, and
Vitest on the frontend. Before changing behavior, inspect the relevant
`package.json` and `tsconfig.json` files and keep new work compatible with the
current scripts, module format, and folder structure. Avoid unnecessary
dependency additions or architecture swaps.

### III. HTTP and In-Memory Only
All client/server synchronization MUST use HTTP request/response flows and
polling when freshness is needed. WebSockets, Socket.io, SSE, and any other
push channel are forbidden. Databases, persistent stores, sessions, JWTs, and
OAuth are also forbidden. Game and room state MUST remain in memory and must be
explicitly removed when no longer active.

### IV. Extend, Do Not Rewrite
Changes MUST preserve the starter code’s intent and structure. Prefer small,
composable additions over broad rewrites, and refactor only when the change
clearly improves clarity, extensibility, or testability. Existing abstractions
should be extended rather than replaced unless replacement is materially safer
and better scoped.

### V. Test the Edge Cases
Every meaningful feature MUST include tests that cover the happy path plus the
important failure and boundary cases. For this repo, that includes trimmed
input, empty input, case-insensitive comparisons, multi-room isolation, minimum
player counts, invalid requests, and state transition edge cases. When behavior
depends on business rules, tests MUST describe those rules precisely.

## Additional Constraints

### Repository Boundaries and Validation
Backend code MUST stay in the existing `src/api`, `src/services`, and
`src/models` structure. Frontend code MUST follow the existing functional
component and shared state patterns, with styling kept in the established CSS
locations. Backend request and response boundaries MUST be validated with
Zod. Room state must stay minimal, and inactive rooms must be removed
deliberately rather than left to accumulate.

## Development Workflow

### Incremental, Spec-Driven Changes
Every change MUST be traceable to a spec, plan, or task slice. Inspect the
current codebase before adding new behavior, and prefer incremental commits
that keep the starter runnable. If a change would violate this constitution,
document the reason in the plan and get explicit approval before proceeding.
Tests for changed behavior SHOULD be written or updated with the change, and
they MUST include the edge cases relevant to the feature.

## Governance

This constitution supersedes conflicting guidance in lower-level docs when the
two disagree. Amendments require a clear rationale, a semantic version bump,
and a sync impact report that names the dependent artifacts reviewed or
updated. Versioning follows semver: MAJOR for incompatible governance or rule
changes, MINOR for new or materially expanded principles or sections, and
PATCH for wording or clarification changes. Every spec, plan, and task set
MUST include a constitution check that verifies stack fidelity, HTTP-only
sync, in-memory state, strict typing, and test coverage expectations.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not recorded | **Last Amended**: 2026-05-31
