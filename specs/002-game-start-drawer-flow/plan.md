# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Add the first-round game start flow to the existing HTTP polling model:
trim player names at the API boundary, assign the host as the drawer on start,
select a deterministic secret word from `STARTER_WORDS`, expose that word only
to the drawer, and delete the room immediately if the drawer leaves mid-game.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ and React 18

**Primary Dependencies**: Express, React Router v6, Vite, Zod, Vitest

**Storage**: In-memory room store only

**Testing**: Vitest for backend room-store/API coverage, frontend service/store
coverage, and browser validation in two tabs for polling and drawer visibility

**Target Platform**: Local web app in modern browsers, backend on Node.js

**Project Type**: Full-stack web application

**Performance Goals**: Start-game state should appear on the next polling cycle;
room updates stay deterministic and testable per room code

**Constraints**: No WebSockets, no database, no authentication, no sessions,
no new state/routing libraries, no drawer rotation, no timers, no multiple
rounds

**Scale/Scope**: Small local-session multiplayer use, with a handful of active
rooms and participants per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP-only sync only: satisfied through existing REST endpoints plus polling.
- In-memory only: satisfied by the backend `Map<string, Room>` store.
- Type-safe boundaries: satisfied by TypeScript and Zod at API boundaries.
- Deterministic behavior: satisfied by a pure room-code-based word index and
  host-as-drawer assignment.
- Spec-first delivery: satisfied by updating spec, plan, and downstream docs
  before implementation.
- Verify locally: required via browser validation in at least two tabs.
- Out-of-scope check (Principle VI): confirm the plan does NOT include
  WebSockets, databases, auth, deployment, Docker, new state/routing libs,
  multiple rounds, drawer rotation, timers, bonuses, custom word packs,
  spectator mode, room moderation, room passwords, or starter rewrites.
  Any match MUST be removed before proceeding.

No constitution violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    ├── models/
    └── services/

frontend/
└── src/
    ├── components/
    ├── pages/
    ├── services/
    └── state/
```

**Structure Decision**: Standard monorepo web app. Room lifecycle and
serialization stay in `backend/src/services`, HTTP routes in `backend/src/api`,
shared room state in `frontend/src/state`, and user-facing lobby/game flows in
`frontend/src/pages`.

## Complexity Tracking

No constitution violations require justification.
