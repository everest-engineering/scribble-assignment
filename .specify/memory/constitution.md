<!--
  Sync Impact Report
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (initial population - all new)
  Added sections:
    - Core Principles (5 principles): TypeScript-First & Type Safety, Brownfield Enhancement Discipline, Deterministic Game Logic, HTTP Polling & In-Memory State, Validation & Edge Case Rigor
    - Technical Constraints
    - Development Workflow
    - Governance (versioning, amendment procedure, compliance review)
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (generic placeholders, no constitution-specific references changed)
    - .specify/templates/spec-template.md ✅ (no constitution references)
    - .specify/templates/tasks-template.md ✅ (no constitution references)
    - .specify/templates/checklist-template.md ✅ (no constitution references)
  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First & Type Safety

All code MUST be fully typed. The `any` type is FORBIDDEN; use `unknown` for
genuinely dynamic types with proper narrowing. Immutable data structures MUST be
preferred over mutable ones. Every API payload and response MUST be validated
with Zod schemas at runtime. Fail fast with descriptive type errors rather than
silent coercion.

### II. Brownfield Enhancement Discipline

Every task MUST begin by reading existing code before writing new code. New code
MUST conform to the established file structure, coding patterns, and naming
conventions. Unrelated refactoring is FORBIDDEN. No new top-level dependencies
MAY be introduced without explicit justification in the plan. When in doubt,
match the style of neighboring files.

### III. Deterministic Game Logic (NON-NEGOTIABLE)

All game mechanics — scoring, word selection, turn assignment — MUST be
deterministic. Identical inputs MUST always produce identical outputs.
Randomness, clock-based variance, and non-deterministic behavior are FORBIDDEN.
Every game rule MUST be testable in isolation with predictable results. This
principle ensures reproducible gameplay and reliable automated testing.

### IV. HTTP Polling & In-Memory State

All client-server sync MUST use HTTP polling only. WebSockets, Server-Sent
Events, and any real-time push protocols are FORBIDDEN. All state MUST be stored
in-memory only. Databases, persistent storage, and external caches are
FORBIDDEN. Inactive rooms MUST be cleaned up to minimize memory footprint. Room
state MUST be recoverable solely from polling responses.

### V. Validation & Edge Case Rigor

Every user input MUST be validated: trimmed, with empty and whitespace-only
inputs rejected via clear error messages. All API payloads MUST pass Zod
validation before reaching business logic. Edge cases MUST be documented in the
spec before implementation begins. Systems MUST fail fast with descriptive error
messages — never silently swallow errors. Case-insensitive comparison MUST be
used where appropriate (e.g., guess matching).

## Technical Constraints

- **Technology Stack**: Node.js + Express (backend), React 18 + Vite (frontend),
  TypeScript throughout, Zod for runtime validation.
- **Forbidden Technologies**: WebSockets/Socket.io, databases (SQL, NoSQL,
  SQLite), authentication (sessions, JWT, OAuth), deployment/infrastructure
  tooling, new state-management or routing libraries beyond what the starter
  ships.
- **Dependency Policy**: No new top-level dependencies without explicit
  justification. Prefer starter-provided dependencies. Bundle size and
  maintenance burden MUST be considered before adding any dependency.

## Development Workflow

- **Spec-First**: Every feature MUST begin with a spec defining acceptance
  criteria, edge cases, and user stories before any implementation begins.
- **Incremental Implementation**: Work MUST proceed in ordered, independently
  testable slices. Each slice MUST be validated against acceptance criteria
  before advancing to the next.
- **Commit Discipline**: Commits MUST be granular and meaningful. Each commit
  SHOULD represent a single logical change with a descriptive message. Granular
  commits ease review and traceability.
- **Testing**: When tests are required, they MUST be written before
  implementation and MUST fail initially. Integration tests MUST cover contract
  changes, inter-service communication, and shared schemas.

## Governance

This constitution supersedes all other practices in case of conflict.
Amendments require a documented change description, approval, and a migration
plan.

Versioning follows Semantic Versioning:
- **MAJOR** (X.0.0): Backward-incompatible governance changes, principle
  removals, or redefinitions.
- **MINOR** (0.X.0): New principles or sections added, materially expanded
  guidance.
- **PATCH** (0.0.X): Clarifications, wording fixes, non-semantic refinements.

All plans MUST verify compliance with this constitution before execution.
Complexity that violates constitutional principles MUST be explicitly justified
in the plan under a Complexity Tracking section.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-30
