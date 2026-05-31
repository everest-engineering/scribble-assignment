# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking, input validation, lobby polling, and a start-game endpoint to
the Scribble starter. The creator of a room is automatically the host; only the
host can start the game when ≥ 2 players are in the lobby; all clients detect
the game start via polling and navigate to the Game screen.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+)
**Primary Dependencies**: Express (backend), React + Vite (frontend), Zod (validation — already present)
**Storage**: In-memory `Map<string, Room>` — no database
**Testing**: Existing test files (`schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`)
**Target Platform**: Local development — `localhost:3001` (backend), `localhost:5173` (frontend)
**Project Type**: Web application (frontend + REST backend)
**Performance Goals**: Lobby poll latency ≤ 2s; local network only
**Constraints**: No new top-level npm dependencies; extend starter only; TypeScript throughout

## Constitution Check

*GATE: Must pass before implementation begins. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First — TypeScript only, extend not rewrite | ✅ PASS | All changes extend existing files |
| II. Deterministic Game Rules — trim + validate both sides | ✅ PASS | Zod on server, trim check on client |
| III. Polling, Not Real-Time — `setInterval` 2s | ✅ PASS | No WebSockets introduced |
| IV. Incremental Validation — Scenario 1 only | ✅ PASS | No Scenario 2+ work included |
| V. Simplicity — no new dependencies | ✅ PASS | Zod already present; no additions |

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── rooms.md         ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          ← add hostId to Room + RoomSnapshot; extend RoomStatus
    ├── services/
    │   └── roomStore.ts     ← set hostId on createRoom; add startRoom(); update toRoomSnapshot
    └── api/
        ├── schemas.ts       ← trim+min(1) on name schemas; add startRoomSchema
        └── rooms.ts         ← add POST /:code/start handler

frontend/
└── src/
    ├── services/
    │   └── api.ts           ← add hostId to RoomSnapshot; extend status type; add startGame()
    ├── state/
    │   └── roomStore.ts     ← add startGame() action
    └── pages/
        ├── CreateRoomPage.tsx  ← client-side trim + empty validation
        ├── JoinRoomPage.tsx    ← client-side trim + empty validation for name and code
        └── LobbyPage.tsx       ← polling, host-only Start Game, navigate on status="game"
```

**Structure Decision**: Web application. Backend and frontend already separated
in the starter. All changes are file-level extensions; no new directories needed.

## Backend Changes (ordered by dependency)

### 1. `backend/src/models/game.ts`
- Extend `RoomStatus` to `"lobby" | "game"`
- Add `hostId: string` to `Room` interface
- Add `hostId: string` to `RoomSnapshot` interface

### 2. `backend/src/api/schemas.ts`
- Update `createRoomSchema`: `playerName` → `z.string().trim().min(1, "Player name is required")`
- Update `joinRoomSchema`: same
- Add `startRoomSchema`: `{ participantId: z.string().trim().min(1) }`

### 3. `backend/src/services/roomStore.ts`
- Remove `displayName()` fallback (schema validation now ensures non-empty names)
- In `createRoom()`: set `room.hostId = participant.id`
- In `toRoomSnapshot()`: include `hostId: room.hostId` in returned object
- Add `startRoom(code, participantId)`:
  - Return `null` if room not found (handler maps to 404)
  - Throw or return error signal if `participantId !== room.hostId` (handler maps to 403)
  - Throw or return error signal if `room.participants.length < 2` (handler maps to 400)
  - Call `saveRoom({ ...room, status: "game" })` and return snapshot

### 4. `backend/src/api/rooms.ts`
- Add `POST /:code/start` route using `startRoomSchema` and `startRoom()` service

## Frontend Changes (ordered by dependency)

### 5. `frontend/src/services/api.ts`
- Add `hostId: string` to `RoomSnapshot` interface
- Extend `status` union to `"lobby" | "game"`
- Add `api.startGame(code: string, participantId: string)` → `POST /rooms/:code/start`

### 6. `frontend/src/state/roomStore.ts`
- Add `startGame()` action: calls `api.startGame(room.code, participantId)` with `withLoading`, updates snapshot

### 7. `frontend/src/pages/CreateRoomPage.tsx`
- Before calling `roomStore.createRoom()`: trim `playerName`, show inline error if empty

### 8. `frontend/src/pages/JoinRoomPage.tsx`
- Before calling `roomStore.joinRoom()`: trim both `playerName` and `roomCode`, show inline errors if either empty

### 9. `frontend/src/pages/LobbyPage.tsx`
- Add `setInterval(poll, 2000)` in `useEffect`; clean up with `clearInterval` on unmount
- Keep existing manual "Refresh Room" button (constitution Principle III)
- Derive `isHost = room.hostId === participantId` from store state
- Render "Start Game" button only when `isHost`; disable when `room.participants.length < 2`
- Show `"Need at least 2 players to start"` hint when button disabled
- `handleStartGame()`: call `roomStore.startGame()`, catch and show errors
- In poll result: if `room.status === "game"` → `navigate("/game")`

## Data Flow

```
Create/Join:
  Form (trimmed + validated) → POST /rooms or POST /rooms/:code/join
    → Zod validates → room stored with hostId → {participantId, room} returned
      → RoomStore saves both in React state → navigate("/lobby")

Polling loop (every 2s, lobby only):
  setInterval → GET /rooms/:code?participantId=...
    → room snapshot (with hostId, status) → RoomStore.setRoomSnapshot()
      → if status === "game" → navigate("/game")

Start Game:
  Host clicks → POST /rooms/:code/start {participantId}
    → backend validates host + count → status = "game"
      → host navigates immediately → other clients detect on next poll
```

## Testing Strategy

- Manual two-tab verification per acceptance criteria (primary gate)
- Run `backend` unit tests after model/schema/service changes
- Run `frontend` unit tests after api.ts changes
- Verify: create room → lobby shows disabled Start Game; second tab joins → button enables; host clicks → both tabs land on game screen

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Polling interval leaks if `useEffect` cleanup missing | Always return `() => clearInterval(id)` |
| Zod schema change breaks existing test assertions | Review `schemas.test.ts` after update |
| `displayName()` removal breaks `roomStore.test.ts` | Update test stubs to pass valid trimmed names |
| Start Game fires before second tab polls | Host's own navigation is immediate via response; other clients catch on next poll |
