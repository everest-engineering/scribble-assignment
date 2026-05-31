<!-- Sync Impact Report
  Version: 0.0.0 → 1.0.0
  Added: Full constitution for Scribble multiplayer drawing game
  Templates checked:
    ✅ spec-template.md — consistent
    ✅ plan-template.md — consistent
    ✅ tasks-template.md — consistent
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First
All code must be fully typed. Avoid `any`; use `unknown` for truly dynamic types. Both backend (Express) and frontend (React) use TypeScript with ES Modules. Shared data structures between frontend and backend should be kept in sync.

### II. HTTP Polling Only
All client-server sync MUST use HTTP polling (no WebSockets, Socket.io, or real-time push protocols). The frontend polls backend endpoints at regular intervals (~2s for lobby refresh).

### III. In-Memory State
No databases (SQL, NoSQL, SQLite, etc.). All game state is stored in-memory on the Express server. Rooms that become inactive must be explicitly cleaned up.

### IV. No Authentication
No authentication, sessions, JWT, or OAuth. Players are identified by a participant ID returned at room creation/join time.

### V. Immutability & Pure Functions
Prefer immutable data patterns. Backend returns `structuredClone` copies of rooms. Use pure functions where possible.

## Game Architecture

### Room Lifecycle
Rooms progress through statuses: `lobby` → `playing` → `round_end` → `game_over`. Each round has a drawer and guessers. The secret word is visible only to the drawer. Scores are tracked per participant.

### Data Ownership
- **Backend**: Source of truth for rooms, participants, scores, rounds, guesses, drawings
- **Frontend**: Polls backend for state snapshots; renders UI optimistically

## Development Workflow

### Spec-Driven Development
1. `/speckit.constitution` — Establish project principles
2. `/speckit.specify` — Create feature specification
3. `/speckit.plan` — Generate implementation plan
4. `/speckit.tasks` — Break into actionable tasks
5. `/speckit.implement` — Execute implementation

### Testing
Tests must be written for all new functionality. Backend uses Vitest for unit tests. Tests should verify validation, business logic, and edge cases.

## Governance

The constitution establishes the binding principles for all development. Amendments require updating this file with a version bump. All specs, plans, and implementations must comply with the principles above.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
