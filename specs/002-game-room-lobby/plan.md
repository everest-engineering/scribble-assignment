# Implementation Plan: Game Room Lobby

**Branch**: `002-game-room-lobby` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-room-lobby/spec.md`

## Summary

Enable players to create or join a drawing game room via a unique 4-character code, with the creator automatically becoming the host. The lobby auto-refreshes every ~2 seconds via polling, displays the live player list, and lets only the host start the game once at least 2 players are present. Invalid and empty inputs are rejected with clear inline feedback. Implemented as incremental changes on top of the existing Express + React starter scaffold — no new libraries, no WebSockets, in-memory store only.

## Technical Context

**Language/Version**: TypeScript (strict mode throughout). Node.js 20+ backend, React 18 frontend.

**Primary Dependencies**: Express 4 (backend), Vite + React Router 6 (frontend), Zod (validation), Vitest (tests). All already installed in the starter.

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts`. No database.

**Testing**: Vitest (`backend/vitest.config.ts`, `frontend/vitest.config.ts`). Manual browser verification with two tabs per constitution Principle IV.

**Target Platform**: Local development only (no deployment). Backend on `localhost:3001`, frontend on `localhost:5173`.

**Project Type**: Web application — separate `backend/` and `frontend/` packages.

**Performance Goals**: Lobby refresh within ~2 seconds of any player list change. API responses under 100ms (in-memory store, no I/O).

**Constraints**: No WebSockets. No external databases. No new routing or state-management libraries. Polling interval fixed at 2000ms.

**Scale/Scope**: 2–8 players per room, single active room per session, single-round game. Rooms are ephemeral — lost on server restart.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | All changes extend existing files; no rewrites. Existing routing, components, and API patterns preserved. |
| II. Spec-Driven Development | ✅ Pass | `spec.md` exists; every task in `tasks.md` will map to a spec acceptance criterion. |
| III. Deterministic Game Rules | ✅ Pass | Host = first participant (deterministic). No timers, no random word packs, no rounds. |
| IV. Incremental Validation | ✅ Pass | Four user stories ordered P1→P2. Each independently testable in two browser tabs. |
| V. Simplicity & Scope | ✅ Pass | Polling (explicitly called for in spec). No WebSockets, no DB, no auth, no new libraries. |

**Post-design re-check**: No violations introduced. `hostId` scalar on `Room` is the minimal shared signal. `startRoom` endpoint is the only new route. All changes are additive to existing files.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-room-lobby/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and rationale
├── data-model.md        # Phase 1: entity definitions and schema changes
├── contracts/
│   └── api.md           # Phase 1: API endpoint contract
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code

```text
backend/src/
├── models/
│   └── game.ts          # Add hostId to Room + RoomSnapshot; extend RoomStatus to "lobby"|"active"
├── services/
│   └── roomStore.ts     # Set hostId on createRoom(); add startRoom(); include hostId in toRoomSnapshot()
└── api/
    ├── schemas.ts        # Tighten playerName (required, non-blank); validate code format; add startRoomBodySchema
    └── rooms.ts          # Add POST /:code/start route

frontend/src/
├── services/
│   └── api.ts            # Fix API_BASE_URL (/bug → root); add hostId to RoomSnapshot; add startRoom()
├── state/
│   └── roomStore.ts      # Add startRoom() method
└── pages/
    ├── CreateRoomPage.tsx # Add client-side validation: non-empty playerName
    ├── JoinRoomPage.tsx   # Add client-side validation: non-empty playerName + code format
    └── LobbyPage.tsx      # Auto-poll every 2s; host-only Start Game button (disabled < 2); guest waiting view; auto-navigate on status="active"
```

**Structure Decision**: Web application layout (Option 2) — `backend/` and `frontend/` already exist and are used. No new top-level directories needed.

## Complexity Tracking

> No constitution violations — table not required.
