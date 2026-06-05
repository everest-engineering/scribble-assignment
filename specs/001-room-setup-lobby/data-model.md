# Data Model: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-04

---

## Backend Models (`backend/src/models/game.ts`)

### RoomStatus

```
type RoomStatus = "lobby" | "playing" | "result"
```

Current value: `"lobby"` only.
**Change**: Expand to the full union. `"playing"` is introduced by this scenario.
`"result"` is pre-declared for Scenarios 3–4 to avoid a second breaking type change.

---

### Participant (no change)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier |
| `name` | `string` | Display name (trimmed, non-empty) |
| `joinedAt` | `string` (ISO 8601) | Timestamp of join |

**Validation rule added**: `name` after trim MUST have length ≥ 1. Backend returns 400 if violated.

---

### Room

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Unique 4-char uppercase room code |
| `status` | `RoomStatus` | Type expands | Current room phase |
| `participants` | `Participant[]` | Existing | All players in the room |
| `hostId` | `string` | **NEW** | `id` of the creating participant; never changes |
| `createdAt` | `string` | Existing | ISO 8601 creation timestamp |
| `updatedAt` | `string` | Existing | ISO 8601 last-update timestamp |

---

### RoomSnapshot

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Room code |
| `status` | `RoomStatus` | Type expands | Current room phase |
| `participants` | `Participant[]` | Existing | All participants |
| `hostId` | `string` | **NEW** | Host participant ID for frontend host-detection |
| `availableWords` | `string[]` | Existing | Starter word list (used in Scenario 2) |
| `roles` | `ParticipantRole[]` | Existing | Starter roles (used in Scenario 2) |

---

### RoomSessionResponse (no change)

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | The joining/creating player's own ID |
| `room` | `RoomSnapshot` | Full room snapshot at join/create time |

---

## Frontend Types (`frontend/src/services/api.ts`)

### RoomStatus (mirrored from backend)

```
type RoomStatus = "lobby" | "playing" | "result"
```

**Change**: Replace hardcoded `"lobby"` literal on `RoomSnapshot.status` with `RoomStatus`.

---

### RoomSnapshot (frontend mirror)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Room code |
| `status` | `RoomStatus` | Type expands | Current room phase |
| `participants` | `Participant[]` | Existing | All participants |
| `hostId` | `string` | **NEW** | Host participant ID |
| `availableWords` | `string[]` | Existing | Starter words |
| `roles` | `ParticipantRole[]` | Existing | Starter roles |

---

## State Transitions

```
lobby ──[POST /rooms/:code/start (host only, ≥2 players)]──▶ playing
```

Transition conditions:
- `participantId` in request body MUST equal `room.hostId`
- `room.participants.length >= 2`
- `room.status === "lobby"` (cannot start an already-started room)

The `"playing" → "result"` transition is not in scope for this scenario.

---

## Backend Service Changes (`backend/src/services/roomStore.ts`)

| Function | Change |
|----------|--------|
| `createRoom(playerName?)` | Set `room.hostId = participant.id`; validate trimmed name |
| `joinRoom(code, playerName?)` | Validate trimmed name |
| `toRoomSnapshot(room, viewerParticipantId?)` | Include `hostId` in returned snapshot |
| `startRoom(code, participantId)` | **NEW** — validate host + player count, set `status = "playing"` |
| `createParticipant(name?)` | Trim name; throw `HttpError(400, "Player name is required")` if empty after trim |

---

## Affected Files Summary

| File | Change Type |
|------|-------------|
| `backend/src/models/game.ts` | Expand `RoomStatus`; add `hostId` to `Room` and `RoomSnapshot` |
| `backend/src/services/roomStore.ts` | `createRoom` sets `hostId`; name validation; `toRoomSnapshot` includes `hostId`; new `startRoom` |
| `backend/src/api/rooms.ts` | Add `POST /:code/start` route |
| `backend/src/api/schemas.ts` | Add `startRoomSchema` (`participantId: string`) |
| `frontend/src/services/api.ts` | Add `RoomStatus` type; add `hostId` to `RoomSnapshot`; add `startRoom` API call |
| `frontend/src/state/roomStore.ts` | Add `startRoom()` action |
| `frontend/src/pages/LobbyPage.tsx` | Remove manual refresh; add polling; host guard; start game |
| `frontend/src/pages/CreateRoomPage.tsx` | Trim + reject empty player name |
| `frontend/src/pages/JoinRoomPage.tsx` | Trim + reject empty player name or room code |
