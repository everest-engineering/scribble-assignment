<!--
Sync Impact Report
- Version change: (template) -> 1.0.0
- Modified principles: N/A (initial creation)
- Added sections: Core Principles (I-V), Technical Constraints,
  Development Workflow, Governance
- Removed sections: N/A
- Templates requiring updates:
  .specify/templates/plan-template.md -> no update needed
  .specify/templates/spec-template.md -> no update needed
  .specify/templates/tasks-template.md -> no update needed
  .specify/templates/checklist-template.md -> no update needed
  .opencode/commands/speckit.constitution.md -> no update needed
- Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First & Type Safety
All new code and refactors MUST be fully typed. The `any` type is forbidden;
use `unknown` when a type is truly dynamic. All backend request payloads and
responses MUST be validated with Zod schemas. Frontend props and state shapes
MUST be explicitly defined and exported. Strict type checking in tsconfig MUST
remain enabled.

*Rationale: Type safety catches integration errors at compile time, documents
data contracts between frontend and backend, and prevents room/guess/word state
corruption in a multiplayer game.*

### II. Incremental Brownfield Enhancement
All work MUST operate within the existing codebase structure. No rewrites from
scratch. Each change MUST be a meaningful, independently testable increment.
Existing patterns (routing, component structure, API layout, service layer)
MUST be followed. Directories MUST NOT be restructured unless a new feature
requires it.

*Rationale: The starter is intentionally incomplete to simulate brownfield
enhancement. Rewrites destroy traceability and make PR review impossible.*

### III. Deterministic Game Logic
All game rules MUST be deterministic. Word selection MUST use a fixed algorithm
(e.g., round-robin or index-based) from the starter word list. Scoring MUST
follow a fixed formula. Drawer assignment MUST follow a deterministic rule.
No randomness may be introduced without explicit justification and documentation
in the spec.

*Rationale: Deterministic logic enables reproducible testing, allows reviewers
to verify correctness without running the game, and keeps acceptance criteria
unambiguous.*

### IV. Polling-First Synchronization
All client-server sync MUST use HTTP polling. No WebSockets, Socket.io, or any
real-time push protocol may be introduced. Polling cadence MUST be documented
in the spec (e.g., ~2s for lobby, ~2s for game state). Each poll MUST be a
simple GET request returning the full relevant state snapshot.

*Rationale: The lab explicitly rules out real-time protocols. Polling keeps the
architecture simple, testable with curl alone, and compatible with the starter's
in-memory backend.*

### V. Critical Self-Review & Validation
All AI-generated code MUST be reviewed before committing. Every change MUST be
validated against the spec's acceptance criteria using two browser tabs. The
review MUST confirm: (1) no out-of-scope features were added, (2) all types
compile, (3) the behavior matches the spec, (4) no regressions in existing
flows.

*Rationale: The learning objective is critical evaluation of AI output, not
blind acceptance. Two-tab validation is the cheapest way to catch multiplayer
bugs.*

## Technical Constraints

The following constraints apply to the entire codebase and MUST NOT be violated:

- **No databases**: All data MUST be stored in-memory only. No SQL, NoSQL,
  SQLite, or any persistent storage.
- **No authentication**: No authentication, sessions, JWT, OAuth, or user
  accounts.
- **No real-time protocols**: No WebSockets, Socket.io, SSE, or push protocols.
- **No new state/routing libraries**: No additional state-management or routing
  libraries beyond what the starter ships.
- **In-memory room isolation**: Each room MUST be fully isolated. Restarting
  the backend clears all rooms.
- **Starter word list**: Only the five starter words (`rocket`, `pizza`,
  `castle`, `guitar`, `sunflower`) may be used for secret words.
- **Scoring**: Correct guess = 100 points. No speed bonuses, streaks, or
  multi-round scoring in scope.

## Development Workflow

Every feature MUST follow this ordered workflow:

1. **Discovery**: Read relevant starter files, document gaps and assumptions.
2. **Specify**: Write or update the spec with acceptance criteria
   (Given/When/Then).
3. **Clarify**: Resolve ambiguity with explicit decisions before planning.
4. **Plan**: Update state model, data flow, and file-level change plan.
5. **Tasks**: Decompose the plan into ordered, testable tasks.
6. **Implement**: Complete one meaningful slice at a time. Commit after each
   logical group.
7. **Validate**: Verify acceptance criteria with two browser tabs.

Each phase produces or updates a committed artifact. No phase may be skipped.

## Governance

This constitution is the authoritative document for all development decisions
in the Scribble project. It supersedes any ad-hoc practices or unwritten
conventions.

- **Amendment procedure**: Proposed changes MUST be documented in a commit
  message and reviewed. Amendments that change, remove, or add a principle
  require explicit reasoning in the sync impact report.
- **Versioning policy**: Version follows MAJOR.MINOR.PATCH.
  - MAJOR: Backward-incompatible governance/principle removals or redefinitions.
  - MINOR: New principle/section added or materially expanded guidance.
  - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review**: Every PR MUST reference the current constitution
  version. Any deviation from the principles must be documented in the
  Complexity Tracking section of the plan. The constitution MUST be re-read
  at the start of each planning phase.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
