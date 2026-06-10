<!--
  Sync Impact Report
  Version change: N/A → 1.0.0 (initial constitution creation from template)
  Added sections: Core Principles I-V, Out-of-Scope Boundaries, AI Usage & Review Discipline, Governance
  Modified principles: None (initial creation)
  Removed sections: None
  Templates requiring updates: None (all templates are generic/compatible)
  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First Development

All code MUST be fully typed. Avoid `any`; use `unknown` when types are truly
dynamic. Both backend and frontend use TypeScript with strict mode. Every
function, component, and API handler MUST have explicit type annotations.
Imports MUST use standard ES module imports.

Rationale: Type strictness prevents runtime errors and makes the codebase
self-documenting for brownfield enhancement.

### II. RESTful HTTP Polling

All client-server communication MUST use HTTP request-response only. No
WebSockets, Socket.io, or any real-time push protocol may be introduced. State
sync MUST be achieved via periodic polling from the client (~2s interval for
lobby refresh). Endpoints MUST follow REST conventions with meaningful HTTP
status codes.

Rationale: Keeps the architecture simple, testable, and aligned with the lab's
learning objectives.

### III. In-Memory State Only

No database (SQL, NoSQL, SQLite) or persistent storage may be used. All game
state MUST live in-memory on the backend and is lost on restart. Room lifecycle
MUST include explicit cleanup of inactive rooms to prevent memory leaks. The
memory footprint for active game rooms MUST be kept minimal.

Rationale: Avoids external infrastructure dependencies and keeps focus on game
logic.

### IV. Deterministic Game Logic

Game rules MUST be deterministic and reproducible. Word selection, scoring, and
turn logic MUST produce the same result given the same inputs. Randomness MUST
be avoided; word selection MUST use deterministic indexing from the starter word
list. Case-insensitive comparison MUST be used for guess validation.

Rationale: Deterministic behavior enables reliable testing and a predictable
player experience without external RNG.

### V. Incremental Implementation & Validation

Work MUST proceed through Spec Kit phases: specify → clarify → plan → tasks →
implement → validate. Each feature group MUST be implemented incrementally and
validated against acceptance criteria before moving to the next. Granular,
meaningful commits traceable to the spec are required. Discovered gaps MUST be
documented, not silently fixed.

Rationale: Incremental delivery with validation gates prevents drift between
spec and implementation.

## Out-of-Scope Boundaries

The following are explicitly out of scope and MUST NOT appear in any spec, plan,
tasks, or implementation:

- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker
- New state-management or routing libraries beyond what the starter ships
- Multiple rounds, drawer rotation, timers, countdowns, speed/drawer bonuses
- Custom or random word packs
- Spectator mode
- Moderation features (kick, mute)
- Room passwords or invite links
- Rewriting the starter from scratch
- Unjustified top-level dependencies
- Unrelated refactors

Rationale: These boundaries keep the lab focused at a medium difficulty level.
Out-of-scope work creates drift between artifacts and implementation.

## AI Usage & Review Discipline

All Spec Kit artifacts (constitution, spec, plan, tasks) MUST be line-by-line
reviewed before use. AI-generated code MUST be validated against the spec before
committing. Critical review of AI output is required before every commit.
Deviations from the spec MUST be documented with rationale. AI MUST NOT
introduce out-of-scope features or dependencies.

Rationale: AI assistance is a productivity tool, not a replacement for developer
judgment and accountability.

## Governance

This constitution supersedes all other project practices and agent instructions
in case of conflict.

### Amendment Procedure

1. Propose the change with documented rationale.
2. Obtain approval from the project lead or reviewer.
3. Provide a migration plan for affected artifacts.
4. Update the constitution version according to the versioning policy.

### Versioning Policy

- MAJOR: Backward incompatible governance/principle removals or redefinitions.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

### Compliance

All PRs/reviews MUST verify compliance with this constitution. Complexity MUST
be justified — simpler alternatives MUST be preferred and, if rejected, the
rationale MUST be documented.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-10
