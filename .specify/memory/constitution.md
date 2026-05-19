<!--
  Sync Impact Report
  ==================
  Version change: (template) → 1.0.0
  Modified principles: All 5 principles filled from template placeholders:
    - [PRINCIPLE_1_NAME] → I. TypeScript-First & Type Safety
    - [PRINCIPLE_2_NAME] → II. Spec-Driven Workflow
    - [PRINCIPLE_3_NAME] → III. Immutability & Error Handling (NON-NEGOTIABLE)
    - [PRINCIPLE_4_NAME] → IV. Incremental Delivery & Validation
    - [PRINCIPLE_5_NAME] → V. AI-Assisted Development Discipline
  Added sections: [SECTION_2_NAME] → "Additional Constraints", [SECTION_3_NAME] → "Development Workflow"
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/constitution-template.md — ✅ unchanged (source template)
    - .specify/templates/plan-template.md — ✅ no update needed (generic gates placeholder)
    - .specify/templates/spec-template.md — ✅ no update needed (no principle-specific refs)
    - .specify/templates/tasks-template.md — ✅ no update needed (no principle-specific refs)
    - .specify/templates/checklist-template.md — ✅ no update needed (generic)
  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First & Type Safety

Every new file and refactor MUST be fully typed. `any` is forbidden; `unknown`
MUST be used for truly dynamic types. Backend request and response validation
MUST use Zod schemas. All imports MUST follow ES module conventions. This
ensures the codebase remains maintainable and catches type errors at compile
time rather than runtime.

### II. Spec-Driven Workflow

Development MUST follow the prescribed workflow: Discovery → Specify →
Clarify → Plan → Tasks → Implement → Validate. No implementation changes are
permitted without corresponding Spec Kit artifact updates. Each scenario MUST
be independently testable with two browser tabs. Spec Kit artifacts
(constitution, spec, plan, tasks) MUST remain internally consistent.

### III. Immutability & Error Handling (NON-NEGOTIABLE)

State mutations MUST be explicit and isolated. Prefer immutable data structures
and pure functions. Backend errors MUST use centralized error handlers.
Frontend MUST NOT crash on API exceptions; all error states MUST be handled
gracefully with user-visible feedback. Fail fast, fail gracefully.

### IV. Incremental Delivery & Validation

Implement one scenario at a time in the prescribed order (Room Setup → Game
Start → Gameplay → Result/Restart). Each slice MUST pass its acceptance
criteria before proceeding to the next. Commit after each meaningful unit of
work. Run `npm run build` in both `backend/` and `frontend/` before handoff.
Two-tab multiplayer testing is the primary validation method.

### V. AI-Assisted Development Discipline

All AI-generated code MUST be human-reviewed before committing. AI agents MUST
NOT make architectural decisions without explicit human approval. AI agents
MUST follow this constitution and the guidance in AGENTS.md. Review AI output
critically — do not accept generated code without understanding it.

## Additional Constraints

- **Fixed technology stack**: Backend = Node.js + Express + TypeScript + Zod +
  `tsx`. Frontend = React 18 + React Router 6 + Vite + TypeScript. No
  additional state-management or routing libraries beyond what the starter
  ships.
- **Explicitly out of scope**: WebSockets, databases/persistent storage,
  authentication, deployment/CI/Docker, multiple rounds or drawer rotation,
  timers, spectator mode, moderation features, rewriting the starter from
  scratch, unrelated refactors.
- **Source of truth**: The README.md governs project scope and business
  scenarios. Any ambiguity MUST be resolved against the README.

## Development Workflow

- Work through the four business scenarios in order. Complete each checkpoint
  before moving to the next.
- For each feature group: Discovery → Specify → Clarify → Plan → Tasks →
  Implement → Validate.
- Use two browser tabs for multiplayer testing after each implementation step.
- Build both `backend/` and `frontend/` with `npm run build` before any
  handoff.
- Maintain Spec Kit artifacts incrementally — they MUST reflect the current
  state of implementation.

## Governance

The constitution supersedes all other development practices. Amendments
require: (1) documented rationale, (2) human approval, (3) a version bump
according to SemVer rules defined below. All PRs and code reviews MUST verify
compliance with this constitution. Complexity not justified by the
constitution's principles MUST be explicitly documented and approved.

**Versioning policy**: MAJOR for principle removals or redefinitions. MINOR
for new principles or materially expanded guidance. PATCH for clarifications,
wording refinements, and non-semantic corrections.

**Compliance review**: Every code review MUST check alignment with the five
core principles. Violations MUST be flagged and resolved before merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-19
