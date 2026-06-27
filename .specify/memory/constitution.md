<!--
## Sync Impact Report

**Version change**: 0.1.0 → 0.2.0
**Modified principles**:
- I. TypeScript-First — strengthened with strict mode requirement

**Added sections**: None
**Removed sections**: None

**Templates requiring updates**:
- `.specify/templates/plan-template.md` — ✅ updated (generic template, no constitution-specific references)
- `.specify/templates/spec-template.md` — ✅ updated (generic template, no constitution-specific references)
- `.specify/templates/tasks-template.md` — ✅ updated (generic template, no constitution-specific references)
- `.specify/templates/checklist-template.md` — ✅ updated (generic template, no constitution-specific references)
- `.specify/templates/constitution-template.md` — ✅ updated (this file)

**Follow-up TODOs**: None — all placeholders filled.
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First (Strict Mode)

TypeScript strict mode MUST be enabled (`strict: true` in tsconfig). All code
MUST be fully typed. Avoid `any`; use `unknown` for truly dynamic types. Every
new file and refactor MUST include proper type annotations.

Rationale: Strict mode catches null/undefined errors, implicit-any leaks, and
unchecked callbacks at compile time — critical for a multiplayer game where
multiple clients interact through a shared API.

### II. Extend, Don't Rewrite

All changes MUST extend the existing starter codebase, never replace it.
Preserve established directory structure, naming conventions, component
boundaries, and data flow patterns.

Rationale: The lab evaluates incremental brownfield enhancement. Rewriting
defeats the purpose and creates drift between spec, plan, and implementation.

### III. Spec-Driven Development

Spec Kit artifacts MUST be produced before implementation in this order:
discovery → spec → plan → tasks. Each feature MUST have documented acceptance
criteria using Given/When/Then scenarios. Implementation MUST satisfy all
acceptance criteria before progressing to the next feature.

Rationale: Ensures traceability from requirements to code and prevents scope
creep.

### IV. Deterministic Game Logic

All game rules MUST be deterministic. No randomness in word selection, drawer
assignment, or scoring. Scoring is flat: 100 points for a correct guess, 0 for
incorrect. Round duration is turn-based (no timers). Word selection uses a
deterministic function of round number against the fixed seed list.

Rationale: Deterministic behavior ensures consistent results across clients and
enables reproducible testing.

### V. Minimal Dependencies

No new state-management or routing libraries beyond what the starter ships.
No WebSockets, databases, or authentication modules. No top-level dependencies
without explicit justification in the feature specification.

Rationale: Every dependency is a maintenance burden and an attack surface. The
starter's dependency set (Express, Zod, React, React Router, Vite) is
sufficient for all in-scope features.

## Technical Constraints

- **Sync mechanism**: HTTP polling only. WebSockets, Socket.io, or any
  real-time push protocol is strictly forbidden.
- **Storage**: In-memory only. No SQL, NoSQL, SQLite, or any database.
- **Authentication**: None. No accounts, sessions, JWT, or OAuth.
- **Validation**: Use Zod for all backend request payload and response
  validation.
- **Error handling**: Backend MUST use centralized error handlers. Frontend
  MUST gracefully handle API failures without crashing.
- **Imports**: ES modules with standard relative paths. Backend follows NodeNext
  module resolution.
- **Immutability**: Prefer immutable data structures and pure functions.
- **Frontend components**: MUST use functional components with hooks. Class
  components are forbidden.
- **Test coverage**: Vitest MUST be used for all tests. Line coverage MUST
  meet a minimum of 80%. Coverage thresholds are enforced — dropping below
  blocks the build.

## Development Workflow

1. **Discovery first**: Read relevant starter files and document gaps and
   assumptions before writing any code.
2. **Specify**: Write feature specification with acceptance criteria using
   Given/When/Then format.
3. **Clarify**: Resolve ambiguity before planning — never guess requirements.
4. **Plan**: Update state model, data flow, and file-level changes.
5. **Task**: Decompose the plan into ordered, testable work items.
6. **Implement**: Complete one meaningful slice at a time. Commit after each
   slice.
7. **Validate**: Verify acceptance criteria with two browser tabs before
   moving on.
8. **Build check**: Run `npm run build` in both `backend/` and `frontend/`
   before handing off changes.

## Governance

- This constitution supersedes all other practices and workflow documentation.
- Amendments MUST be documented with version, date, and rationale.
- All PRs and reviews MUST verify compliance with these principles.
- Complexity MUST be justified: any deviation from these principles requires
  explicit documentation in the relevant spec or plan artifact.
- Versioning follows semantic versioning:
  - MAJOR: backward-incompatible governance or principle removals/redefinitions
  - MINOR: new principle or section added, materially expanded guidance
  - PATCH: clarifications, wording, typo fixes, non-semantic refinements

**Version**: 0.2.0 | **Ratified**: 2026-06-26 | **Last Amended**: 2026-06-26
