# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Add a `POST /rooms/:code/start` endpoint that transitions a room from "lobby" to
"playing", assigns the first-joined participant as drawer, and fixes the secret
word as `"rocket"` (index 0 of `STARTER_WORDS`). The existing `GET /rooms/:code`
endpoint is extended so that the drawer — identified by their `participantId` —
receives `secretWord` in their snapshot while all other players do not. The
frontend Lobby's "Start Game" button is wired to call this endpoint; on success
the host immediately navigates to `/game`, and the existing 2-second polling loop
auto-navigates non-host players when their poll detects `status: "playing"`. The
`GamePage` displays the secret word to the drawer only via the already-polled
room snapshot.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS (backend), React 18 (frontend)

**Primary Dependencies**: Express 4 (backend), Vite + React Router v6 (frontend), Zod (request validation), `useSyncExternalStore` (frontend state)

**Storage**: In-memory `Map<string, Room>` — no database

**Testing**: Vitest (backend unit + integration tests already present in `roomStore.test.ts` and `schemas.test.ts`)

**Target Platform**: Local development server (backend :3001, frontend :5173)

**Project Type**: Web application (backend REST API + frontend SPA)

**Performance Goals**: Standard — polling at 2-second intervals, no concurrency pressure in dev/test

**Constraints**: No new npm dependencies; no randomness for game logic; no authentication layer; strict TypeScript (`any` prohibited)

**Scale/Scope**: Single-room, in-memory, 2-player minimum dev scenario

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield discipline — read starter files before extending | PASS | All relevant files read: `models/game.ts`, `services/roomStore.ts`, `api/rooms.ts`, `api/schemas.ts`, `seed/starterData.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx` |
| No wholesale rewrites | PASS | Adding a new endpoint and extending existing types/functions only |
| Spec-driven — spec committed before plan | PASS | `specs/002-game-start-drawer/spec.md` created on this branch |
| Deterministic game rules — no randomness for word/drawer | PASS | Drawer = `participants[0]`; word = `STARTER_WORDS[0]` ("rocket") |
| No new top-level npm dependencies | PASS | No new packages required |
| Input validation — trim + reject whitespace-only | PASS | `startGame` service function validates all participant names before transitioning |
| TypeScript strict — no `any` | PASS | All new types will be explicit |
| In-memory store only | PASS | No persistence introduced |

*Post-design re-check*: All gates still pass after Phase 1 design (see data-model.md and contracts/).

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── start-endpoint.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # extend RoomStatus, Room, RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     # add startGame(), update toRoomSnapshot()
│   └── api/
│       ├── rooms.ts         # add POST /:code/start route
│       └── schemas.ts       # add startRoomParamsSchema (if needed)
└── tests/                   # extend roomStore.test.ts

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           # extend RoomSnapshot type, add startRoom()
│   ├── state/
│   │   └── roomStore.ts     # add startRoom() method, handle "playing" status
│   └── pages/
│       ├── LobbyPage.tsx    # wire Start Game button → startRoom() + immediate nav; auto-nav on poll
│       └── GamePage.tsx     # display secretWord in Player Info card for drawer only
└── tests/
```

**Structure Decision**: Web application (Option 2). Backend and frontend are separate
projects under `backend/` and `frontend/` respectively — matching the existing repo
layout. No new directories are introduced.
