# Implementation Plan: Scenario 1 — Room Setup & Lobby

**Branch**: `feat/scribble-lab` | **Date**: 2026-06-04 | **Spec**: — *(spec.md not generated; requirements derived directly from Scenario 1 description)*

**Input**: Scenario 1 — Room Setup & Lobby user story

## Summary

Implement room creation, joining via unique code, lobby polling, and host-only game start for a multiplayer drawing game ("Scribble"). The creator of a room is automatically the host. Invalid/empty room codes are rejected with clear feedback. Rooms are fully isolated in-memory. The lobby auto-refreshes every ~2 seconds via HTTP polling. Only the host can start the game, and only when at least 2 players are present.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)

**Primary Dependencies**: Express + Zod (backend), React 18 + React Router 6 (frontend)

**Storage**: In-memory `Map<string, Room>` — no database

**Testing**: Vitest (already configured in both `backend/package.json` and `frontend/package.json`)

**Target Platform**: Web browser + Node.js 20+ server

**Project Type**: Web application (Express API + React SPA)

**Performance Goals**: Lobby polling <500ms round-trip; room create/join <200ms

**Constraints**: No WebSockets (polling only), no databases (in-memory only), no authentication

**Scale/Scope**: Dozens of concurrent rooms in-memory; single-server deployment

## Constitution Check

*GATE: Passed — re-check after Phase 1 design.*

- **No WebSockets**: All sync via HTTP polling ✅
- **No Databases**: In-memory Map only ✅
- **No Authentication**: No auth introduced ✅

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/scenario-1-room-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — test scenarios
├── contracts/           # Phase 1 — API contracts
│   └── start-game.md
└── tasks.md             # Phase 2 — task breakdown (generated separately)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Add hostId to Room + RoomSnapshot
│   ├── services/
│   │   ├── roomStore.ts          # createRoom sets hostId; add isHost(), canStartGame()
│   │   └── roomStore.test.ts     # Tests for host + start validation
│   └── api/
│       ├── rooms.ts             # Add POST /rooms/:code/start
│       ├── schemas.ts           # Zod: reject empty codes
│       ├── schemas.test.ts      # Test: empty code rejection
│       └── router.ts            # No changes

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx        # Auto-polling, host-only start, min-2 check
│   │   └── JoinRoomPage.tsx     # Empty-code validation + error display
│   ├── state/
│   │   └── roomStore.ts         # No structural changes
│   └── services/
│       └── api.ts              # Add startGame()
```

## Complexity Tracking

No complexity violations. All changes are minimal, scoped to Scenario 1.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
