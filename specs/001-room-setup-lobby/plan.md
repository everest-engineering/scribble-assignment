# Implementation Plan: Room Setup & Lobby

**Branch**: `assignment` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

---

## Summary

Add host tracking to room creation, validate player names and room codes, replace
the manual refresh button with automatic ~2s polling, and add a host-only Start
Game endpoint that gates on ≥2 participants. Non-hosts auto-navigate when polling
detects `status === "playing"`.

---

## Technical Context

**Language/Version**: TypeScript 5 (backend: Node 18 + Express; frontend: React 18 + Vite)

**Primary Dependencies**: Express, Zod (validation), React hooks (`useEffect` for polling)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts`

**Testing**: Vitest — extend existing `roomStore.test.ts` and `schemas.test.ts`

**Target Platform**: localhost dev server (backend :3001, frontend :5173)

**Project Type**: Brownfield web application enhancement

**Performance Goals**: Polling latency ≤ 2s; no other performance targets

**Constraints**: No WebSockets, no DB, no auth. In-memory only. Polling cadence ~2s fixed.

**Scale/Scope**: 2–6 players per room; single active round per room

---

## Constitution Check

*GATE: Must pass before implementation begins. Re-checked after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing models/routes; no rewrites |
| II. Spec-Driven | ✅ Pass | Every change traces to FR-001–FR-011 in spec |
| III. Deterministic Rules | ✅ Pass | No game rules in this group; host = first participant |
| IV. Strict Scope | ✅ Pass | No WebSockets, DB, auth, or new npm dependencies |
| V. Incremental Validation | ✅ Pass | Checkpoint: 2-tab lobby test before starting Group 2 |
| VI. AI-Assisted, Human-Reviewed | ✅ Pass | All output reviewed before commit |

---

## Research Findings

### Host Identification

**Decision**: Store `hostId` as the `id` of the first participant added during
`createRoom`. Set once, never changes.

**Rationale**: Simplest possible approach — one extra field on the existing Room
model. No new concept required.

**Alternatives considered**: Separate `isHost` boolean on Participant — rejected
(more fields, same outcome, more mutation surface).

### Polling Strategy

**Decision**: `setInterval` (2000ms) inside a `useEffect` in `LobbyPage`, with
`clearInterval` in the cleanup return.

**Rationale**: Matches starter hook patterns, zero new dependencies, cleanup on
unmount automatically stops background requests.

**Alternatives considered**: Recursive `setTimeout` — unnecessary complexity for
a fixed interval.

### Start Game Endpoint

**Decision**: New `POST /rooms/:code/start` accepting `participantId` in the
request body. Validates host identity and ≥2 participants, sets
`room.status = "playing"`, returns updated `RoomSnapshot`.

**Rationale**: Follows existing `POST /rooms` and `POST /rooms/:code/join`
patterns exactly.

**Alternatives considered**: Query-param `participantId` on POST — rejected
(non-standard for state-mutating operations).

### Name Validation

**Decision**: Trim + empty-check on frontend (before API call, inline error
message) and in Zod schema on backend (400 on empty after trim).

**Rationale**: Frontend avoids unnecessary round-trips; backend guards against
direct API calls.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md         ← this file
├── spec.md
├── research.md     ← findings above (condensed inline)
├── data-model.md
├── contracts/
│   └── start-room.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
backend/
├── src/
│   ├── models/game.ts              ← add hostId to Room + RoomSnapshot; expand status type
│   ├── services/roomStore.ts       ← set hostId in createRoom(); add startGame()
│   ├── api/
│   │   ├── rooms.ts                ← add POST /:code/start handler
│   │   └── schemas.ts              ← add startRoomSchema; tighten name validation (trim+min)
│   └── services/roomStore.test.ts  ← extend: hostId set, startGame gates
│
frontend/
├── src/
│   ├── services/api.ts             ← add hostId to RoomSnapshot; add startRoom()
│   ├── state/roomStore.ts          ← add startRoom() action
│   ├── pages/LobbyPage.tsx         ← replace manual refresh with polling; host-only start; auto-nav
│   ├── pages/CreateRoomPage.tsx    ← add name trim + empty-check
│   └── pages/JoinRoomPage.tsx      ← add name trim + empty-check; code empty-check
```

**Structure Decision**: Web application (Option 2) — existing `backend/` + `frontend/` layout preserved.

---

## Data Model Changes

### Backend `Room` (game.ts)

```
Before:  code, status: "lobby", participants[], createdAt, updatedAt
After:   code, status: "lobby" | "playing" | "result", hostId, participants[], createdAt, updatedAt
```

### Backend `RoomSnapshot` (game.ts)

```
Before:  code, status, participants[], availableWords, roles
After:   code, status, hostId, participants[], availableWords, roles
```

### Frontend `RoomSnapshot` (api.ts)

```
Before:  code, status: "lobby", participants[], availableWords, roles
After:   code, status: "lobby" | "playing" | "result", hostId, participants[], availableWords, roles
```

---

## API Contracts

### Updated responses (existing endpoints)

`POST /rooms` — `room` in response now includes `hostId`

`GET /rooms/:code` — `room` in response now includes `hostId`

### New endpoint

```
POST /rooms/:code/start
Body:    { "participantId": "<uuid>" }

200 OK:
  { "room": { "code": "ABCD", "status": "playing", "hostId": "...", "participants": [...], ... } }

403 Forbidden:
  { "message": "Only the host can start the game" }
  { "message": "Need at least 2 players to start" }

404 Not Found:
  { "message": "Unable to load room" }
```

---

## Data Flow

### Create Room (updated)

```
CreateRoomPage validates name (trim, non-empty)
  → POST /rooms { playerName }
  → roomStore.createRoom() sets hostId = participant.id
  → returns { participantId, room: { ...hostId } }
  → RoomStore.setRoomSession(); navigate("/lobby")
```

### Join Room (updated)

```
JoinRoomPage validates name (trim, non-empty) + code (trim, non-empty, uppercase)
  → POST /rooms/:code/join { playerName }
  → returns { participantId, room: { ...hostId } }
  → RoomStore.setRoomSession(); navigate("/lobby")
```

### Lobby Polling (new)

```
LobbyPage mounts
  → useEffect: setInterval(2000, fetchRoom)
  → each tick: GET /rooms/:code?participantId=<id>
     → roomStore.setRoomSnapshot(room)
     → if room.status === "playing": navigate("/game")
  → cleanup: clearInterval on unmount / navigation
```

### Start Game (new)

```
Host: Start Game button enabled when isHost && participants.length >= 2
  → POST /rooms/:code/start { participantId }
  → server: hostId === participantId && length >= 2 → status = "playing"
  → host navigates immediately to "/game"
  → non-hosts: next poll detects status "playing" → auto-navigate to "/game"
```

---

## Implementation Sequence

1. Backend: extend `Room` + `RoomSnapshot` types with `hostId` and updated `status`
2. Backend: `createRoom()` sets `hostId`; `toRoomSnapshot()` includes it
3. Backend: Zod schemas — trim + `min(1)` on `playerName`; add `startRoomSchema`
4. Backend: `startGame()` in roomStore; `POST /:code/start` route in rooms.ts
5. Frontend: update `RoomSnapshot` type; add `startRoom()` to api.ts
6. Frontend: add `startRoom()` action to RoomStore
7. Frontend: name validation in `CreateRoomPage` + `JoinRoomPage`
8. Frontend: `LobbyPage` — polling with auto-nav; host-only Start Game button

---

## Testing Strategy

- Extend `roomStore.test.ts`: `hostId` set on `createRoom`; `startGame` 403 for non-host; `startGame` 403 for <2 players; `startGame` success sets status to "playing".
- Manual two-tab validation against all acceptance criteria in spec (SC-001–SC-005).
- No new test files — extend existing only.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Polling fires after component unmounts | `clearInterval` in `useEffect` cleanup |
| Non-host calls `/start` directly | Server-side 403: `hostId !== participantId` |
| Name whitespace passes validation | Both frontend trim-check and Zod `min(1)` after trim |
| Old frontend code breaks on missing `hostId` | TypeScript strict mode catches missing field at compile time |
