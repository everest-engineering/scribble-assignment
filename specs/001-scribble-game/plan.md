# Implementation Plan: Scribble Multiplayer Drawing Game

**Branch**: `scribble-lab` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-scribble-game/spec.md`

## Summary

The Scribble drawing game is a multiplayer, web-based drawing and guessing application. It consists of a React frontend and an Express backend. All game state is stored in-memory using Node.js memory structures, and client synchronization is handled via 2-second HTTP polling. Drawing canvas vectors and guesses are fully synchronized over polling.

## Technical Context

**Language/Version**: TypeScript 5.6 (strictly typed, ES Modules)

**Primary Dependencies**: Express 4.21, Zod 3.23 (backend validation), React 18.3, React Router v6 (frontend)

**Storage**: In-memory JavaScript Map (in `roomStore.ts`). No databases.

**Testing**: Vitest for both backend and frontend unit tests.

**Target Platform**: Node.js 18+ (backend), Modern Browsers (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Canvas updates render on guesser screens within 2.5 seconds. UI state updates are fast (<50ms locally).

**Constraints**:
- Strictly NO WebSockets. Polling cadence ~2s.
- Strictly NO databases/sessions/authentication.
- Zero external libraries for canvas drawing, pure HTML5 canvas and standard React event handlers.

**Scale/Scope**: Up to 10 active players per room, 1 active drawing room session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript First**: Yes, Zod validates payloads, and all backend/frontend entities are strictly typed.
- **ES Modules**: Yes, backend imports use `.js` extension, frontend uses relative imports.
- **In-Memory Only**: Yes, rooms Map is in-memory only.
- **No WebSockets**: Yes, frontend page hooks poll `GET /rooms/:code` every 2s.
- **No Auth**: Yes, participant IDs are generated per session.

## Project Structure

### Documentation (feature + scenarios)

```text
specs/
├── 001-scribble-game/           # Feature umbrella (shared design)
│   ├── plan.md                  # This file
│   ├── spec.md                  # Index + cross-cutting requirements
│   ├── research.md
│   ├── quickstart.md
│   ├── tasks.md                 # Setup, foundational, polish
│   ├── checklists/
│   └── contracts/
│       ├── api.md
│       └── data-model.md
├── 001-room-setup-lobby/        # Scenario P1
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── 002-game-start-drawer/       # Scenario P2
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── 003-gameplay-interaction/    # Scenario P3
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
└── 004-result-restart/          # Scenario P4
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   └── roomStore.ts
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   └── app.ts
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx
│   │   ├── Scoreboard.tsx
│   │   └── ResultPanel.tsx
│   ├── pages/
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Monorepo with split `backend/` and `frontend/` folders. This aligns exactly with the repository structure.

## Complexity Tracking

No constitution violations detected.
