<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial ratification — all placeholders replaced)

Modified principles: N/A (initial creation from template)

Added sections:
  - Core Principles (5 principles defined)
  - Technology Constraints
  - Development Workflow
  - Governance

Removed sections: N/A

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates aligned with these principles
  ✅ .specify/templates/spec-template.md — no structural changes required; principles compatible
  ✅ .specify/templates/tasks-template.md — task phases align with incremental delivery principle
  ✅ .specify/templates/constitution-template.md — source template unchanged (as required)

Deferred TODOs: None — all fields resolved from project context.
-->

# Scribble Constitution

## Core Principles

### I. Spec-First Development

Every feature or behavior change MUST have an approved specification in
`specs/` before implementation begins. The spec MUST include acceptance
scenarios, functional requirements, and success criteria. Code written
without a corresponding spec is not eligible for review or merge.

**Rationale**: AI-assisted development generates code quickly; without an
upfront spec the output cannot be validated against intended behavior. The
spec is the contract; the code is the implementation.

### II. Brownfield Awareness

Existing code, API routes, and data shapes MUST be inspected and understood
before being modified. Existing API contracts (routes, payloads, status codes)
MUST NOT be changed unless explicitly required by the spec and documented as
a breaking change. Full rewrites of existing modules are disallowed without
explicit justification in the spec.

**Rationale**: The starter codebase contains working routes and UI flows.
Unguarded changes risk breaking features that already work and make diffs
harder to review.

### III. Incremental, Story-Sliced Delivery

Work MUST be decomposed into independently testable user story slices ordered
by priority (P1 → P2 → P3). Each slice MUST deliver value on its own and be
validated before the next slice begins. No slice may depend on future slices
to be testable.

**Rationale**: Incrementalism keeps feedback loops short, isolates regressions
to a single slice, and allows partial delivery of a working product.

### IV. Critical AI Review Before Commit

All AI-generated code MUST be read, understood, and critically assessed by
the author before it is staged. Commits containing code the author cannot
explain are disallowed. Acceptance criteria from the spec MUST be verified
manually or via tests before a story is declared done.

**Rationale**: AI assistants can produce plausible but incorrect code.
Blind acceptance transfers the spec's risk to production. The author is
responsible for every line in the diff.

### V. Granular, Meaningful Commits

Each commit MUST represent one logical unit of change (a task, a test, a
fix). Commit messages MUST describe the intent of the change, not the
mechanics. Bulk "implement everything" commits are disallowed. Commits MUST
NOT bundle unrelated concerns.

**Rationale**: The PR diff is the primary artefact reviewers assess. Granular
commits make intent legible, regressions bisectable, and the learning record
auditable.

## Technology Constraints

This project runs exclusively on the following stack. Deviations require
explicit justification in the spec and approval via a constitution amendment.

- **Frontend**: Vite + React + TypeScript — existing `frontend/` directory
- **Backend**: Node.js + Express + TypeScript — existing `backend/` directory
- **State**: In-memory store only; no external database or persistence layer
- **API protocol**: REST over HTTP only; no WebSockets, GraphQL, or SSE
- **Testing**: Each story MUST be manually verifiable via browser + API calls;
  automated tests are OPTIONAL unless the spec explicitly requires them
- **Dependencies**: New npm packages require rationale in the plan; prefer
  the standard library and existing dependencies first

## Development Workflow

1. **Inspect** the relevant existing code before writing any new code.
2. **Write** a spec (`/speckit-specify`) and get it reviewed before implementing.
3. **Clarify** ambiguities via `/speckit-clarify` before planning.
4. **Plan** implementation (`/speckit-plan`) tied to real files in the repo.
5. **Decompose** into ordered tasks (`/speckit-tasks`) by user story priority.
6. **Implement** one task at a time; commit after each logical unit.
7. **Validate** each user story slice against its acceptance scenarios before
   starting the next.
8. **Raise a PR** from the feature branch to `main` using the PR template;
   include your email and role in the PR description.

All work MUST flow through a feature branch. Direct commits to `main` are
disallowed.

## Governance

This constitution supersedes all other practices, style guides, or verbal
agreements for this project. When a conflict exists between this document and
any other artefact, this constitution takes precedence.

**Amendment procedure**: Any amendment MUST (a) describe the change and
rationale, (b) increment the version following semantic versioning rules,
(c) update the `Last Amended` date, and (d) be committed with a message of
the form `docs: amend constitution to vX.Y.Z (<summary>)`.

**Versioning policy**:
- MAJOR — principle removed, redefined, or governance restructured
- MINOR — new principle or section added
- PATCH — wording clarification, typo fix, non-semantic refinement

**Compliance review**: Every PR description MUST confirm that the implementation
complies with all five Core Principles. Reviewers MUST reject PRs that cannot
demonstrate compliance. See `README.md` for the PR template.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
