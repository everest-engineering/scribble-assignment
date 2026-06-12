<!--
SYNC IMPACT REPORT
Version Change: 0.0.0 → 1.0.0
Modified Principles: N/A (initial ratification — all 5 principles are new)
  - I. TypeScript-First & Strict Typing
  - II. In-Memory State Discipline
  - III. HTTP Polling Only — No Real-Time Protocols
  - IV. Extend the Starter — Do Not Rewrite
  - V. Phased Implementation with Validation Gates
Added Sections:
  - Game Rule & Scope Constraints
  - Development Workflow & AI Review Discipline
Removed Sections: N/A
Templates Requiring Updates:
  - .specify/templates/plan-template.md — Constitution Check gate should reference the 5 principles above
  - .specify/templates/spec-template.md — should align scope with Game Rule & Scope Constraints
  - .specify/templates/tasks-template.md — should reflect phased workflow and validation gates
Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First & Strict Typing

All new code MUST be fully typed. Avoid `any`; use `unknown` only when a value is truly dynamic. The backend uses Zod for all request/response validation. The frontend uses strict hooks and functional components.

**Rationale**: The starter is TypeScript; weakening types introduces bugs that could be caught at compile time.

### II. In-Memory State Discipline

All game state lives in-memory only. No databases, no persistent storage, no sessions, no caching layers. Room state must be minimal and explicitly cleaned up.

**Rationale**: The lab explicitly forbids databases; state bloat causes memory leaks and drift between restarts.

### III. HTTP Polling Only — No Real-Time Protocols

Player synchronization MUST use HTTP polling only. Do not introduce WebSockets, Socket.io, Server-Sent Events, or any real-time push protocol. The starter uses manual refresh; we will add automatic polling (~2s).

**Rationale**: Out of scope and would violate the lab's technical boundaries.

### IV. Extend the Starter — Do Not Rewrite

Work within the existing file structure, routes, and component hierarchy. Make minimal, focused edits. Do not add new top-level dependencies unless the spec explicitly justifies them. Do not refactor unrelated code.

**Rationale**: The evaluation rewards traceability; rewrites destroy commit history and make review impossible.

### V. Phased Implementation with Validation Gates

Complete each feature group (Room Setup → Game Start → Gameplay → Result/Restart) before starting the next. Validate acceptance criteria with two browser tabs before moving forward.

**Rationale**: Scope creep and half-finished features across all screens make debugging and grading difficult.

## Game Rule & Scope Constraints

The following rules are non-negotiable for every implementation and review:

- Only one round is implemented; no drawer rotation, timers, or multiple rounds.
- Word list is fixed: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.
- Host is the room creator. Only the host can start the game. Minimum 2 players required to start.
- Player names are trimmed; empty/whitespace-only names are rejected with a clear message.
- Guesses are trimmed and compared case-insensitively. Empty guesses are rejected.
- Correct guesses score exactly 100 points; incorrect guesses score 0.
- The drawer sees the secret word; guessers do not.
- On restart, all round state (scores, guesses, canvas, word, drawer) is cleared, but players and host remain in the lobby.

## Development Workflow & AI Review Discipline

- **Discovery notes** must document ≥3 incomplete behaviors, ≥2 assumptions, and list relevant files before writing specs.
- **Specifications** must be updated incrementally per feature group with acceptance criteria.
- **Plans** must include state model changes, data flow, and file-level changes.
- **Tasks** must be ordered with explicit dependencies.
- Before committing AI-generated code, review for alignment with the spec, out-of-scope work, and type safety.
- Run `npm run build` in both `/backend` and `/frontend` before considering a feature complete.

## Governance

- This constitution supersedes all other practices.
- Amendments require a version bump and a sync impact report.
- All PRs/reviews must verify compliance with the Out-of-Scope list.

**Version**: 1.0.0 | **Ratified**: 2026-06-11 | **Last Amended**: 2026-06-11
