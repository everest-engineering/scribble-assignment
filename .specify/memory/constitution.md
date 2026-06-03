<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR — two new principles added (Contract First, Error Boundaries);
  Principle I refined (explicit tsconfig wording, @ts-ignore rule tightened);
  Principle III materially expanded (TDD methodology named, business-logic scope explicit).

Modified principles:
  - I. TypeScript Strict Mode → I. Type Safety
      (renamed to match user input; rule text tightened around tsconfig.json and @ts-ignore)
  - III. Test Coverage (Vitest ≥ 80%) → III. Test First (TDD)
      (renamed; TDD Red-Green-Refactor cycle added; business logic scope made explicit)

Added principles:
  - VI. Contract First (Zod runtime validation + shared TS types before implementation)
  - VII. Error Boundaries (standardised user-facing messages for all HTTP failures)

Removed principles: none

Modified sections:
  - Technology & Constraints: added Zod row
  - Quality Gates: added gates 6 (Zod schemas present) and 7 (error boundary coverage)

Templates requiring updates:
  - .specify/templates/plan-template.md       ✅ compatible (Constitution Check generic)
  - .specify/templates/spec-template.md       ✅ compatible
  - .specify/templates/tasks-template.md      ✅ already updated (test tasks mandatory)

Follow-up TODOs: none — all principles fully specified.
-->

# Scribble Constitution

## Core Principles

### I. Type Safety

`tsconfig.json` in both `frontend/` and `backend/` MUST set `"strict": true`. This flag MUST NOT
be weakened or selectively disabled via per-file overrides. The `any` type is forbidden; use
`unknown` where the type is genuinely indeterminate and narrow it explicitly before use. Type
assertions (`as T`) are permitted only at system boundaries (JSON parse results, DOM API returns,
third-party library integration points) and MUST NOT substitute for correct typing elsewhere.
`// @ts-ignore` is forbidden without a documented inline justification comment that names the
specific compiler limitation being worked around; a suppressions-only comment ("shuts up TS") is
not a valid justification.

**Rationale**: Strict mode eliminates a large class of runtime errors at compile time. The `@ts-ignore`
ban with documented exceptions ensures suppressions are intentional and auditable rather than
accumulated technical debt.

### II. Functional Components & Existing Patterns

React components MUST be written as function components. Class components are forbidden for new
code. State MUST be managed with hooks (`useState`, `useReducer`, `useContext`, or equivalent).
New code MUST follow the structural and naming conventions already established in `frontend/src/`
and `backend/src/` — inspect existing files before introducing a new abstraction. When the existing
pattern is unclear, match the majority convention in the nearest sibling file rather than inventing
a new one.

**Rationale**: The codebase is an in-progress brownfield project. Consistency with existing
patterns reduces cognitive overhead for reviewers and avoids gratuitous rewrites that obscure
the intent of the change.

### III. Test First (TDD)

Business logic MUST be implemented via Test-Driven Development following the Red-Green-Refactor
cycle: write a failing test → make it pass with minimal code → refactor. No production code for
business logic may be written without a corresponding failing test already in place. The overall
Vitest coverage gate is **≥ 80% line/branch coverage** and MUST pass in CI before merging. A PR
that ships business-logic code without corresponding tests will not be merged. Test files live
adjacent to source files or under a `tests/` sibling directory, following the pattern already
present in the repository.

**Rationale**: TDD enforces intentional design and catches regressions in core gameplay paths
(room creation, joining, drawing, guessing) that are difficult to detect manually across browser
tabs. The 80% threshold is a minimum floor, not a target ceiling.

### IV. Accessibility (WCAG 2.1 AA)

All UI components and screens MUST meet WCAG 2.1 Level AA. Concretely:

- Interactive elements MUST be keyboard-accessible and focusable in logical tab order.
- Non-decorative images and icon buttons MUST carry descriptive `alt` text or `aria-label`.
- Colour contrast for text and UI components MUST meet the 4.5:1 ratio (3:1 for large text).
- Dynamic content updates (e.g., guess feed, canvas changes) MUST be surfaced to screen readers
  via `aria-live` regions where appropriate.

Automated accessibility checks (e.g., axe-core or vitest-axe) MUST be included in the test suite
for each new screen or significant component.

**Rationale**: Scribble is a multiplayer social game. Excluding players who rely on assistive
technology is a product failure, not a "nice to have".

### V. Bundle Discipline & Scope

The production frontend bundle (all JS chunks combined) MUST remain **≤ 150 KB** (gzipped). New
dependencies require explicit justification; prefer tree-shakeable packages and prefer utilities
already present in the project over introducing equivalents. The application is **stateless by
design** — no external database, no browser `localStorage`/`sessionStorage` persistence, and no
server-side session storage beyond what Express holds in-memory for the lifetime of the process.
Introducing any form of persistence (file, DB, cache service, cookie store) is a breaking
constitution change requiring a MAJOR version bump.

**Rationale**: The in-memory constraint keeps the starter portable and deployment-free. The bundle
ceiling keeps the game load fast for players on average connections. Both constraints are
intentional product decisions, not technical limitations to work around.

### VI. Contract First

All frontend-backend contracts — request/response payloads and route endpoint shapes — MUST be
defined as **Zod schemas** and derived **shared TypeScript types** before any implementation work
begins on either side. Schemas MUST live in a shared location accessible to both `frontend/` and
`backend/` (e.g., `shared/schemas/`). Runtime validation using the Zod schema MUST be applied at
the HTTP boundary on the backend (request parsing) and on the frontend (response parsing). Inline
`fetch` calls that cast responses directly to a TS type without Zod validation are forbidden.

**Rationale**: Defining contracts before implementation prevents frontend/backend drift and
provides runtime safety guarantees that TypeScript types alone cannot offer. Shared schemas are
the single source of truth for the wire format.

### VII. Error Boundaries

The frontend MUST display a **standardised, user-facing error message** for every HTTP failure
(4xx and 5xx responses, network errors, and Zod parse failures on responses). Error messages MUST:

- Be human-readable and non-technical (no raw stack traces, status codes, or JSON blobs).
- Appear in a consistent UI location (e.g., a toast, an inline alert component) across all screens.
- Not silently swallow errors (i.e., `catch` blocks that do nothing are forbidden).

React error boundary components MUST wrap each route/page to prevent unhandled rendering errors
from crashing the entire application.

**Rationale**: Gameplay sessions involve multiple browser tabs and real-time state. Silent or
cryptic failures create confusing multi-player experiences and make bugs harder to diagnose.

## Technology & Constraints

| Layer     | Technology                          | Notes                                              |
|-----------|-------------------------------------|----------------------------------------------------|
| Frontend  | Vite + React 18 + TypeScript strict | Functional components, hooks-first                 |
| Backend   | Node.js 18+ + Express + TypeScript  | In-memory state only, no persistence               |
| Contracts | Zod + shared TS types               | Defined before implementation; runtime-validated   |
| Testing   | Vitest                              | ≥ 80% coverage gate; TDD; frontend + backend       |
| Linting   | Follow existing ESLint config       | Do not downgrade or disable rules                  |
| Bundler   | Vite                                | Production bundle ≤ 150 KB gzipped                 |

The starter seed data (words, roles) is in-memory and MUST remain the authoritative source of
truth. No file-backed seed, database seed, or migration concept is permitted under this
constitution.

## Quality Gates

Every pull request MUST pass all of the following before merge:

1. **TypeScript compilation** with `strict: true` — zero errors.
2. **Vitest** test suite — all tests pass, ≥ 80% line/branch coverage, TDD cycle followed
   (failing test committed before production code).
3. **Bundle size check** — production Vite build reports ≤ 150 KB (gzipped JS).
4. **Accessibility** — automated axe scan passes with zero critical or serious violations on
   affected screens.
5. **No persistence introduced** — grep for `localStorage`, `sessionStorage`, `fs.write`,
   database driver imports; none permitted.
6. **Zod contracts present** — every new or modified endpoint has a Zod schema in `shared/`;
   no raw `fetch` response casts without Zod parse.
7. **Error boundary coverage** — every new route/page is wrapped in a React error boundary;
   no empty `catch` blocks; HTTP failures surface a user-facing message.

Reviewers are expected to verify compliance with these gates during code review. CI SHOULD
automate gates 1–3 and gate 5 at minimum.

## Governance

This constitution supersedes all other documented or implicit conventions for the Scribble project.
Amendments follow these rules:

- **PATCH** (clarification, wording): any contributor may propose; single reviewer approval.
- **MINOR** (new principle or section, material expansion): requires design discussion in PR
  description; two reviewer approvals.
- **MAJOR** (principle removal, redefinition, or lifting of the no-persistence constraint):
  requires team consensus and an explicit migration plan.

All PRs and reviews MUST verify compliance with the Core Principles and Quality Gates above.
Complexity beyond what the existing codebase patterns establish MUST be justified in the PR
description. The `README.md` is the primary runtime guidance document for this project.

**Version**: 1.1.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
