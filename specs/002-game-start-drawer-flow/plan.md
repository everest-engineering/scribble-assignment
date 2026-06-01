# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Implement Scenario 2 by turning "Start Game" into a shared room state transition. The backend will validate the room can start, assign the first-round drawer, select the first starter word deterministically, and return viewer-specific snapshots so only the drawer sees the secret word. The frontend will call the start action from the lobby, poll into the active game state, and render clear drawer/word visibility on the game screen.

## Technical Context

**Language/Version**: TypeScript 5.6; Node.js 18+ backend; React 18 frontend

**Primary Dependencies**: Express, Zod, `tsx`, React, React Router v6, Vite, Vitest

**Storage**: In-memory room store only

**Testing**: Vitest unit and service tests for backend and frontend; manual two-browser validation for role visibility

**Target Platform**: Local web app with backend service on `localhost:3001` and frontend on `localhost:5173`

**Project Type**: Monorepo web application with REST backend and React frontend

**Performance Goals**: Start-game transition completes within one normal user action; polling reflects active game state within the established ~2 second lobby cadence

**Constraints**: TypeScript-only; ES Modules; Zod validation for request/response boundaries; HTTP polling only; no WebSockets; no databases; no authentication; minimal in-memory state

**Scale/Scope**: One active first round per room; 2+ players; deterministic starter word selection; no drawing, guessing, scoring, result, restart, multiple rounds, timers, or drawer rotation in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript First**: PASS. Plan modifies only typed backend/frontend modules and shared contracts.
- **Test-First Development**: PASS. Tasks must add failing tests for name validation, start transition, drawer assignment, and viewer-specific word visibility before implementation.
- **Immutability & Pure Functions**: PASS. Room updates remain localized to `roomStore`; snapshots are cloned and viewer-specific.
- **Error Handling**: PASS. Backend start failures return clear errors; frontend keeps players in lobby and displays friendly messages.
- **Strict Backend & Frontend Architecture**: PASS. Business logic remains in `backend/src/services`, routes in `backend/src/api`, models in `backend/src/models`, UI state in `frontend/src/state`, and page rendering in `frontend/src/pages`.
- **Technology Constraints**: PASS. No WebSockets, database, authentication, sessions, JWT, or new top-level dependencies are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   └── services/
│       ├── roomStore.ts
│       └── roomStore.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   └── styles/
│       └── app.css
└── package.json
```

**Structure Decision**: Use the existing web application structure. Backend models define room/round/snapshot types, backend services own game-start mutations, backend API routes expose room actions, frontend services wrap REST calls, frontend state holds the current viewer snapshot, and pages render lobby/game states.

## Phase 0: Research

Research output is captured in [research.md](./research.md). All technical unknowns are resolved with project-local decisions:

- Start-game transition is backend-owned so all players poll the same room phase.
- First-round drawer is host first, with first participant fallback.
- First word is the first item in the starter word list.
- Secret-word visibility is enforced in viewer-specific room snapshots.
- Existing polling remains the synchronization mechanism.

## Phase 1: Design & Contracts

Design output is captured in:

- [data-model.md](./data-model.md)
- [contracts/http-api.md](./contracts/http-api.md)
- [quickstart.md](./quickstart.md)

Key design decisions:

- Extend `Room.status` to include `inProgress`.
- Add optional round state containing `roundNumber`, `drawerId`, `secretWord`, `startedAt`, and a status.
- Add `POST /rooms/:code/start` for host-initiated game start.
- Extend `RoomSnapshot` with viewer-safe `currentRound`; include `secretWord` only when `participantId` matches `drawerId`.
- Keep name validation centralized through existing Zod schemas and service-level trimmed names.

## Post-Design Constitution Check

- **TypeScript First**: PASS. Data model and contract changes are typed end to end.
- **Test-First Development**: PASS. Quickstart and future tasks require tests before implementation.
- **Immutability & Pure Functions**: PASS. Round creation is a focused state transition; returned snapshots remain cloned.
- **Error Handling**: PASS. Contract defines clear failure responses for invalid room, non-host start, insufficient players, and invalid names.
- **Strict Backend & Frontend Architecture**: PASS. No new architecture layer is introduced.
- **Technology Constraints**: PASS. The design uses REST and polling with in-memory state only.

## Complexity Tracking

No constitution violations require justification.
