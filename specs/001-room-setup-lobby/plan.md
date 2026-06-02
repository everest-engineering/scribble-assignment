# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Extend the existing Scribble scaffold so that: (1) rooms track a host via a `hostId` field, (2) the join endpoint rejects mid-game joins, (3) the lobby polls automatically every 2 seconds and redirects on failure, (4) a host-only "Start Game" button (disabled until ≥2 players) triggers a backend status transition to `"playing"`, and (5) all clients auto-navigate to `/game` once polling detects the new status. All changes are additive and confined to existing files — no new files are required except the `POST /api/rooms/:code/start` route handler, which lives in the existing router.

## Technical Context

**Language/Version**: TypeScript 5.x — backend Node.js 18+, frontend Vite + React 18

**Primary Dependencies**: Express (backend), React Router v6 (frontend), Zod (backend validation), Vitest (testing) — no new dependencies

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no persistence

**Testing**: Vitest — `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`, `frontend/src/services/api.test.ts`

**Target Platform**: Browser (frontend) + Node.js HTTP server (backend)

**Project Type**: Web application — REST backend + React SPA

**Performance Goals**: Lobby polling latency ≤ 2s; no targets beyond normal HTTP response times for a local dev server

**Constraints**: No WebSockets, no database, no auth; `setInterval` MUST be cleared on component unmount; polling failure MUST redirect immediately to `/`

**Scale/Scope**: Small — 5 files modified, 1 new endpoint, ~150–200 lines net change

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                      | Status  | Notes                                                                        |
| ------------------------------ | ------- | ---------------------------------------------------------------------------- |
| I. TypeScript-First            | ✅ PASS | All changes in `.ts`/`.tsx`; no `any` introduced                             |
| II. In-Memory State Only       | ✅ PASS | `hostId` added to `Room` in the existing Map; no persistence added           |
| III. HTTP Polling              | ✅ PASS | `setInterval` in `LobbyPage` `useEffect` with cleanup; no WebSockets         |
| IV. Validate at Every Boundary | ✅ PASS | Zod schema added for `startRoom` body; join rejects non-lobby rooms with 409 |
| V. Minimal Footprint — YAGNI   | ✅ PASS | No new dependencies; changes confined to existing files                      |

**Post-design re-check**: All five principles remain passing after Phase 1 design (see data-model.md and contracts/).

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md          ← this file
├── research.md      ← Phase 0 output
├── data-model.md    ← Phase 1 output
├── quickstart.md    ← Phase 1 output
├── contracts/
│   └── rooms-api.md ← Phase 1 output
└── tasks.md         ← Phase 2 output (created by /speckit.tasks)
```

### Source Code (files touched by this feature)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts                  ← add hostId to Room; add "playing" to RoomStatus
    ├── services/
    │   ├── roomStore.ts             ← createRoom sets hostId; joinRoom checks status; new startRoom()
    │   └── roomStore.test.ts        ← new tests for hostId, late-join rejection, startRoom
    └── api/
        ├── schemas.ts               ← new startRoomSchema (participantId optional per clarification)
        ├── schemas.test.ts          ← new schema tests
        └── rooms.ts                 ← new POST /:code/start route handler

frontend/
└── src/
    ├── services/
    │   ├── api.ts                   ← fix /bug URL defect; add startRoom() call; add RoomStatus union
    │   └── api.test.ts              ← new tests for startRoom, URL fix
    ├── state/
    │   └── roomStore.ts             ← add startRoom() action
    └── pages/
        └── LobbyPage.tsx            ← polling useEffect; host-only start button; disable logic
```

## Complexity Tracking

No constitution violations. No entry needed.

## Data Flow

### Create Room (existing — extended)

```
CreateRoomPage
  → roomStore.createRoom(name)
    → api.createRoom(name)                       POST /api/rooms
      → [backend] createRoom(playerName)
          participant = { id: uuid, name, joinedAt }
          room = { code, status:"lobby", participants:[participant],
                   hostId: participant.id,        ← NEW
                   createdAt, updatedAt }
      → { participantId, room: RoomSnapshot }
    ← store.setRoomSession(response)
  → navigate("/lobby")
```

### Join Room (existing — extended)

```
JoinRoomPage
  → roomStore.joinRoom(code, name)
    → api.joinRoom(code, name)                   POST /api/rooms/:code/join
      → [backend] joinRoom(code, playerName)
          if (!room)        → 404
          if (room.status !== "lobby") → 409 "Game already in progress"  ← NEW
          room.participants.push(newParticipant)
      → { participantId, room: RoomSnapshot }
  → navigate("/lobby")
```

### Lobby Polling (new)

```
LobbyPage mounts
  → useEffect: intervalId = setInterval(poll, 2000)
      poll():
        api.fetchRoom(code, participantId)        GET /api/rooms/:code
          on success: store.setRoomSnapshot(room)
            if room.status === "playing" → navigate("/game")  ← NEW
          on error:   clearInterval; navigate("/")            ← NEW
  → cleanup: clearInterval(intervalId)
```

### Start Game (new)

```
LobbyPage (host only, ≥2 participants)
  → handleStartGame()
    → api.startRoom(code)                        POST /api/rooms/:code/start
      → [backend] startRoom(code)
          if (!room)        → 404
          room.status = "playing"
      → { room: RoomSnapshot }
    ← store.setRoomSnapshot(room)
    → navigate("/game")     [host navigates immediately]
    [guests navigate via next poll detecting status:"playing"]
```

## State Model Changes

### `backend/src/models/game.ts`

```typescript
// BEFORE
export type RoomStatus = "lobby";
export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

// AFTER
export type RoomStatus = "lobby" | "playing";
export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string; // ← new: participantId of the creator
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string; // ← new: exposed to clients
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### `frontend/src/services/api.ts`

```typescript
// BEFORE
export interface RoomSnapshot {
  code: string;
  status: "lobby";
  ...
}
const API_BASE_URL = ... ?? "http://localhost:3001/bug";   // defect

// AFTER
export type RoomStatus = "lobby" | "playing";
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;           // ← new
  ...
}
const API_BASE_URL = ... ?? "http://localhost:3001/api";   // fix
// + new: api.startRoom(code)  →  POST /api/rooms/:code/start
```

## File-Level Change Plan

| File                                | Change Type | Description                                                                                                                                  |
| ----------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/models/game.ts`        | Modify      | `RoomStatus` add `"playing"`; `Room` add `hostId: string`; `RoomSnapshot` add `hostId: string`                                               |
| `backend/src/services/roomStore.ts` | Modify      | `createRoom` sets `hostId`; `joinRoom` rejects non-lobby rooms with 409; new `startRoom(code)` function; `toRoomSnapshot` exposes `hostId`   |
| `backend/src/api/schemas.ts`        | Modify      | New `startRoomSchema` (empty body — no participantId needed per clarification Q2); new `roomStatusSchema`                                    |
| `backend/src/api/rooms.ts`          | Modify      | New `POST /:code/start` route handler calling `startRoom()`                                                                                  |
| `frontend/src/services/api.ts`      | Modify      | Fix `/bug` URL defect; add `RoomStatus` type union; add `hostId` to `RoomSnapshot`; add `api.startRoom(code)`                                |
| `frontend/src/state/roomStore.ts`   | Modify      | Add `startRoom()` async action calling `api.startRoom`                                                                                       |
| `frontend/src/pages/LobbyPage.tsx`  | Modify      | Add polling `useEffect`; conditionally render host-only Start button; disable when `participants.length < 2`; navigate on `status:"playing"` |

## Implementation Sequence

```
Phase 1 — Model (no UI impact, safe to ship alone)
  1. game.ts        — add hostId, "playing"
  2. roomStore.ts   — createRoom sets hostId, toRoomSnapshot exposes it, joinRoom rejects, startRoom new
  3. schemas.ts     — startRoomSchema

Phase 2 — API surface (depends on Phase 1)
  4. rooms.ts       — POST /:code/start handler

Phase 3 — Frontend types + service (depends on Phase 1 model)
  5. api.ts         — fix URL, add types, add startRoom()
  6. roomStore.ts (FE) — add startRoom action

Phase 4 — UI (depends on Phase 2 + Phase 3)
  7. LobbyPage.tsx  — polling, start button, navigation
```

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
