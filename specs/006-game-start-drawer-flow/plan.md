# Implementation Plan: Game Start and Drawer Flow

**Branch**: `006-game-start-drawer-flow` | **Date**: 2026-07-06 | **Spec**: `specs/006-game-start-drawer-flow/spec.md`

**Input**: Feature specification from `specs/006-game-start-drawer-flow/spec.md`

## Summary

Validate player names on create/join (trim, reject empty). Implement game start — a new POST endpoint transitions room from "lobby" to "drawing" status, assigns the host as round-1 drawer, and selects a secret word deterministically via `(round - 1) % words.length`. The secret word is included in API responses only for the drawer participant.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+ for backend, React 18 + Vite for frontend)

**Primary Dependencies**: Express (backend), React 18 + React Router v6 + Vite (frontend), Zod (validation), Vitest (testing)

**Storage**: In-memory Map<string, Room> — no database

**Testing**: Vitest for both backend and frontend; two-browser manual validation for multiplayer flows

**Target Platform**: Modern browsers via Vite dev server (development) and production build

**Project Type**: Web application (monorepo with `backend/` + `frontend/` directories)

**Performance Goals**: No performance impact — small data additions (few fields per room)

**Constraints**: No WebSockets, no databases, no authentication. All sync via HTTP polling (~2s interval). No random outcomes. Must match existing code patterns (brownfield).

**Scale/Scope**: Single feature spanning backend (room state + API endpoint) and frontend (name validation, game start flow, drawer/word display)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Deterministic Game Logic | ✅ Pass | Word selection via `(round - 1) % words.length` — no randomness. Host is always round-1 drawer per spec. |
| II. RESTful Synchronization | ✅ Pass | Game start uses POST endpoint. State propagation via existing HTTP polling. No push protocol. |
| III. Validation Rigor | ✅ Pass | Player name trimmed and rejected if empty on both client and server. Consistent with existing room-code validation patterns. |
| IV. Brownfield Enhancement | ✅ Pass | Extends existing Room, RoomSnapshot, and api.ts types. Adds one new route. No new dependencies. |
| V. State Isolation & Immutability | ✅ Pass | Room state gains new fields (`currentRound`, `currentDrawerId`). Existing Map isolation preserved. `toRoomSnapshot` already uses spread/map patterns. |

**No violations** — Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/006-game-start-drawer-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # RoomStatus: add "drawing"; RoomSnapshot: add currentRound, currentDrawerId, secretWord
│   ├── services/
│   │   └── roomStore.ts         # add startGame() function, update toRoomSnapshot for word visibility per viewer
│   └── api/
│       ├── schemas.ts           # createRoomSchema/joinRoomSchema: playerName becomes non-empty string
│       ├── rooms.ts             # add POST /:code/start endpoint
│       └── router.ts            # unchanged

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx   # add empty-name validation before submit
│   │   ├── JoinRoomPage.tsx     # add empty-name validation before submit
│   │   ├── LobbyPage.tsx        # "Start Game" button calls POST /:code/start (currently just navigate)
│   │   └── GamePage.tsx         # show secret word to drawer, label drawer, show round number
│   ├── services/
│   │   └── api.ts               # add startGame method, update RoomSnapshot types
│   └── state/
│       └── roomStore.ts         # add startGame method
```

**Structure Decision**: Web application layout (Option 2). Both backend and frontend are modified.

## Complexity Tracking

> Not required — all Constitution Check gates pass with no violations.
