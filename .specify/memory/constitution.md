<!--
Sync Impact Report
Version change: [TEMPLATE] → 1.0.0
Added sections:
  - Core Principles (I. Brownfield Discipline, II. Spec-Driven Development,
    III. Deterministic Game Rules, IV. AI-Assisted Human-Accountable, V. Validate Each Slice)
  - Coding Standards
  - Self-Review & Quality Gates
  - Governance
Modified principles: none (initial ratification)
Removed sections: none (template placeholders replaced)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check gate wording aligns
  - .specify/templates/spec-template.md ✅ No changes required
  - .specify/templates/tasks-template.md ✅ No changes required
Deferred TODOs: none
-->

# Scribble Assignment Constitution

## Core Principles

### I. Brownfield Discipline

Before writing any new code, read the relevant starter files and document gaps and
assumptions. Existing routes, components, and in-memory state MUST be understood before
extending them. No wholesale rewrites of starter code are permitted. Scope is strictly
bounded by the README's "Explicitly Out Of Scope" list; work outside that boundary MUST
NOT appear in the spec, plan, or tasks.

### II. Spec-Driven Development

Implementation MUST follow this order: constitution → spec → clarify → plan → tasks →
implement → validate. No phase may be skipped. Acceptance criteria in the spec are the
source of truth; if code and spec disagree, fix the code or update the spec with explicit
justification. Each spec iteration MUST be committed before the next phase begins. At
least 4 specify iterations are required across the four phased checkpoints.

### III. Deterministic Game Rules

All game-rule outcomes MUST be deterministic and reproducible given the same inputs.
Word selection MUST use the fixed starter word list in a defined, stable order (not
random). Drawer assignment MUST follow a defined rule (host or first player). Scoring
MUST apply fixed rules: correct guess = 100 points, incorrect guess = 0 points. No
source of non-determinism (randomness, timestamps used for logic) may be introduced
without explicit spec approval and documentation.

### IV. AI-Assisted, Human-Accountable

All AI-generated code and artifacts MUST be reviewed by the developer before committing.
The developer is responsible for correctness — not the AI. AI suggestions that contradict
the spec, introduce out-of-scope dependencies, or add unjustified complexity MUST be
rejected. Each commit MUST be granular, meaningful, and traceable to a task in tasks.md.

### V. Validate Each Slice

Every implemented scenario MUST be verified with two browser tabs before moving to the
next scenario. A slice is not complete until its acceptance criteria pass. No partial
implementations may be committed as complete. Both `frontend/` and `backend/` TypeScript
builds MUST pass (`npm run build`) before marking any task done.

## Coding Standards

- **Language**: TypeScript (strict mode) for both frontend and backend; `any` is
  prohibited without documented justification.
- **Frontend**: Vite + React; no new state-management or routing libraries beyond what
  the starter ships.
- **Backend**: Node.js + Express; in-memory store only; no databases, persistence, or
  authentication layers.
- **Input validation**: All user-supplied strings MUST be trimmed; empty or
  whitespace-only values MUST be rejected with a clear, user-facing error message.
- **Polling**: Lobby and game state MUST be polled at approximately 2-second intervals;
  WebSockets and server-sent events are out of scope.
- **Dependencies**: No new top-level npm dependencies without explicit justification in
  the plan; all prohibited categories listed in the README are enforced here.
- **Commits**: Granular and meaningful; each commit maps to a task or a logical
  sub-task with a clear message.

## Self-Review & Quality Gates

Before marking any task complete:
1. Verify TypeScript builds pass in both `frontend/` and `backend/`.
2. Verify the acceptance criteria for the relevant scenario with two browser tabs.
3. Confirm no out-of-scope behavior was added.
4. Review AI-generated output for correctness, scope creep, and unnecessary complexity.

Before submitting the PR:
- All four phased checkpoints MUST be validated end-to-end.
- Constitution, spec, plan, and tasks artifacts MUST be internally consistent and
  committed to the branch.
- A reflection report MUST be present in the repository.

## Governance

This constitution supersedes all informal conventions and takes precedence over
individual preference when a conflict arises. Amendments require: (1) documenting the
change and rationale in a commit, (2) incrementing the version per semantic versioning
(MAJOR = principle removal/redefinition, MINOR = new section or material expansion,
PATCH = wording and clarification), and (3) propagating updates to dependent templates.
Any principle violation discovered during review MUST be resolved before merging. The
README is authoritative for scope boundaries; this constitution is authoritative for
workflow rules, coding standards, and AI usage discipline.

**Version**: 1.0.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
