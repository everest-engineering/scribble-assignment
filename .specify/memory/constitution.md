<!--
SYNC IMPACT REPORT
==================
Version change: [template] → 1.0.0
Modified principles: N/A (initial population from template)
Added sections: Core Principles (I–V), AI Usage Rules, Self-Review & Testing Standards, Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check section already present; gates align with principles below
  - .specify/templates/spec-template.md ✅ Acceptance criteria format aligns with deterministic principle (P-III)
  - .specify/templates/tasks-template.md ✅ Phase structure aligns with incremental principle (P-IV, P-V)
  - README.md ✅ No principle references to update; README is authoritative source for scope constraints
Follow-up TODOs: None — all placeholders resolved.
-->

# Scribble Constitution

## Core Principles

### I. Brownfield Discipline

Before writing any new code, developers MUST read and understand the relevant starter
files. The existing architecture (Express backend, Vite + React frontend, in-memory
store) MUST be preserved. Rewriting the starter from scratch is forbidden.
New code MUST integrate into the existing routing and component structure rather than
replacing it.

**Rationale**: Brownfield work is the default in production engineering. Inspection
before modification prevents duplicate state, broken contracts, and spec drift.

### II. Spec-First, Artifact-Driven Development

No implementation work MUST begin until the relevant spec, plan, and tasks artifacts
are approved and committed. Artifacts MUST be updated before code changes when
requirements change mid-feature. Each implementation task MUST be traceable to a
spec acceptance criterion.

AI-generated code MUST be reviewed and understood before it is committed. The
developer is responsible for every line, regardless of origin.

**Rationale**: Artifacts are the contract between intent and implementation. Skipping
them produces code that cannot be reviewed, extended, or graded for alignment.

### III. Deterministic Game Logic

All game-rule outcomes — word selection, drawer assignment, scoring, guess comparison —
MUST be deterministic and fully specified before implementation. The spec MUST define
the exact rule (e.g., "first item in the starter word list", "first player to join is
drawer", "correct guess scores exactly 100"). Guesses MUST be trimmed and
case-insensitively compared. Empty or whitespace-only inputs MUST be rejected with a
user-visible message.

**Rationale**: Determinism makes behavior testable, reviewable, and reproducible
across two-browser validation sessions without ambiguity.

### IV. Simplicity & Scope Discipline

Developers MUST NOT add libraries, routing abstractions, state-management solutions,
or top-level dependencies beyond the starter's existing packages without explicit
written justification. Out-of-scope items listed in the README (WebSockets,
authentication, persistent storage, timers, multiple rounds, etc.) MUST NOT appear
in the spec, plan, tasks, or implementation.

If complexity is introduced, it MUST be documented in the plan's Complexity Tracking
table with a justification for why a simpler alternative was rejected.

**Rationale**: Scope creep degrades spec–implementation alignment and inflates review
surface. The starter's boundaries exist to keep the lab at a focused difficulty level.

### V. Incremental Validation Before Advancement

Each phased checkpoint (Scenario 1 → 2 → 3 → 4) MUST be validated with two browser
tabs before work on the next scenario begins. Commits MUST be granular — one logical
change per commit — and MUST remain traceable to a task ID. A checkpoint is only
"done" when both the acceptance criteria pass and the commit is pushed.

Polling intervals MUST target approximately 2 seconds for lobby and guess-history
sync. Deviations MUST be documented in the plan.

**Rationale**: Incremental validation prevents cascading failures and ensures the PR
diff is assessable at each checkpoint, not only at the end.

## AI Usage Rules

AI-generated output (code, plans, specs, tasks) MUST be treated as a first draft
requiring developer review — not as ground truth.

Developers MUST NOT commit AI-generated code they cannot explain. If a generated
implementation diverges from the spec, the spec is authoritative; the code MUST be
corrected, not the spec silently abandoned.

AI tools MUST NOT be used to bypass the artifact workflow. Spec → Plan → Tasks →
Implement is the required order regardless of how confident the AI appears.

Developers SHOULD use AI tools to accelerate discovery, drafting, and validation,
but MUST apply critical review before accepting any suggestion that touches game
logic, API contracts, or scope boundaries.

## Self-Review & Testing Standards

Before marking any task complete, the developer MUST:

1. Verify the behavior manually in two browser tabs (or one tab + one API call for
   backend-only tasks).
2. Confirm the implementation matches the acceptance criteria in the spec — not just
   that it "looks right".
3. Confirm no out-of-scope behavior was introduced.
4. Run both build commands (`npm run build` in `backend/` and `frontend/`) and
   confirm they succeed with no errors.

Tests are encouraged but not mandatory for this lab. When written, tests MUST target
real in-memory state (no mocking the room store) so behavior matches production paths.

Reflection notes documenting AI usage, tradeoffs, and deviations MUST be included in
the final submission.

## Governance

This constitution supersedes all informal practices and verbal agreements. Any
amendment MUST be committed to `.specify/memory/constitution.md` with a version
bump following semantic versioning:

- **MAJOR**: Removal or incompatible redefinition of a core principle.
- **MINOR**: New principle or section added, or material expansion of guidance.
- **PATCH**: Wording clarification, typo fix, or non-semantic refinement.

All PRs MUST verify compliance with this constitution before merge. Complexity
violations MUST be logged in the plan before the PR is raised, not after.

The README is the authoritative source for scope boundaries. In case of conflict
between the README and this constitution, the README governs for scope decisions;
this constitution governs for engineering practice.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
