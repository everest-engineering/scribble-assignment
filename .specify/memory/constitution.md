<!--
  Sync Impact Report
  Version change: N/A → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections:
    - Core Principles (5 principles: AI-Assisted Development, TypeScript & Type Safety, Architecture Constraints, Test-First & Validation, Deterministic Game Logic)
    - Technology Stack & Boundaries
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ no changes needed (generic Constitution Check gate)
    - .specify/templates/spec-template.md: ✅ no changes needed (aligned with all principles)
    - .specify/templates/tasks-template.md: ✅ no changes needed (phase structure aligns with iterative workflow)
    - .opencode/commands/speckit.constitution.md: ✅ no changes needed
  Follow-up TODOs: None
-->
# Scribble Constitution

## Core Principles

### I. AI-Assisted Development Discipline
All AI-generated output MUST be reviewed and approved by a human before
committing. Ambiguity in requirements MUST be clarified before implementation
begins. AI assistants must disclose confidence levels and flag uncertainties.
Rationale: The lab exercises AI-assisted workflow where human oversight is the
critical quality gate.

### II. TypeScript & Type Safety
All code MUST be fully typed. The `any` type is forbidden; use `unknown` for
truly dynamic values. Backend request/response validation MUST use Zod. ES
Modules MUST be used throughout both backend and frontend. Rationale: Type
safety prevents runtime errors and makes the codebase self-documenting for
multi-player game logic.

### III. Architecture Constraints (NON-NEGOTIABLE)
- No WebSockets, Socket.io, or any real-time push protocol. All sync MUST use
  HTTP polling.
- No databases (SQL, NoSQL, SQLite, or otherwise). All data MUST be stored
  in-memory only.
- No authentication, sessions, JWT, or OAuth.
- No new state-management or routing libraries beyond what the starter ships.
Rationale: These constraints keep the lab focused on brownfield enhancement at
an intermediate difficulty level.

### IV. Test-First & Validation
Tests MUST be written before implementation begins. Acceptance criteria from
the spec MUST be verifiable through automated or manual tests. Edge cases
MUST be handled explicitly: empty/whitespace inputs, case-insensitive
comparisons, multi-room isolation. Rationale: Incremental validation against
acceptance criteria is the core feedback loop of this lab.

### V. Deterministic Game Logic
Game rules MUST be deterministic: scoring, word selection, and drawer
assignment must produce the same result given the same inputs. No randomness
may be introduced without explicit specification. State transitions MUST be
predictable and documented. Rationale: Deterministic behavior ensures
consistent gameplay across all clients without real-time sync mechanisms.

## Technology Stack & Boundaries

**Backend**: Node.js, Express, TypeScript, Zod, tsx for execution.
**Frontend**: React 18, React Router v6, Vite, TypeScript.
**Testing**: Vitest in both environments.

The following are explicitly OUT OF SCOPE and MUST NOT be introduced:
WebSockets, databases, authentication, deployment/CI/Docker, multiple rounds
or drawer rotation, timers or countdowns, custom word packs, spectator mode,
moderation features, room passwords, rewriting the starter from scratch,
unjustified top-level dependencies, unrelated refactors.

## Development Workflow

All feature work MUST follow this iterative loop:

1. **Discovery**: Read relevant starter files, document gaps and assumptions.
2. **Specify**: Update spec with acceptance criteria per business scenario.
3. **Clarify**: Resolve ambiguity before planning.
4. **Plan**: Update state model, file-level changes, and data flow.
5. **Tasks**: Decompose plan into ordered, testable work items.
6. **Implement**: Complete one meaningful slice at a time and commit.
7. **Validate**: Verify acceptance criteria (two-browser test for multiplayer
   flows). Move forward only after the current scenario passes.

Commits MUST be granular and meaningful. Build validation MUST pass before
handoff. Each commit MUST be traceable to the spec.

## Governance

This constitution supersedes all other development practices. Amendments
require:
- A documented rationale.
- A version bump following semantic versioning (MAJOR for incompatible
  governance changes, MINOR for new principles/sections, PATCH for
  clarifications).
- Compliance verification during PR review.
- Complexity MUST be justified when it deviates from stated principles.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-01
