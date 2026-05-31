# Data Model: Game Room Lobby

**Branch**: `002-game-room-lobby` | **Date**: 2026-05-30

## Entities

### Room

Represents an active game session container, held in the in-memory store on the backend.

| Field          | Type              | Description                                                         |
|----------------|-------------------|---------------------------------------------------------------------|
| `code`         | `string` (4 chars) | Unique room identifier; 4 uppercase chars from safe alphabet        |
| `status`       | `RoomStatus`      | `"lobby"` (waiting) or `"active"` (game started)                   |
| `hostId`       | `string` (UUID)   | `id` of the participant who created the room — **new field**        |
| `participants` | `Participant[]`   | Ordered list of players; host is always `participants[0]`           |
| `createdAt`    | `string` (ISO)    | Timestamp of room creation                                          |
| `updatedAt`    | `string` (ISO)    | Timestamp of last mutation                                          |

**State transitions**:
- `"lobby"` → `"active"`: triggered by `POST /rooms/:code/start` when the host has ≥ 2 participants and `status === "lobby"`.
- No transition back to `"lobby"` — rooms are ephemeral and single-session.

**Validation rules**:
- A room with < 2 participants cannot be started (enforced server-side with HTTP 409).
- Only the participant whose `id === room.hostId` may call the start endpoint (enforced server-side with HTTP 403).

---

### Participant

Represents a player within a room.

| Field      | Type            | Description                                               |
|------------|-----------------|-----------------------------------------------------------|
| `id`       | `string` (UUID) | Unique participant identifier, assigned at join time      |
| `name`     | `string`        | Display name; must be non-empty and non-whitespace-only   |
| `joinedAt` | `string` (ISO)  | Timestamp of when this player joined                      |

**Validation rules**:
- `name` must be at least 1 non-whitespace character (enforced at API schema layer and client-side).

---

### RoomSnapshot (API read shape)

The read-only view of a room returned to clients. This is what `GET /rooms/:code` and the responses of POST endpoints return inside `room`.

| Field          | Type              | Description                                          |
|----------------|-------------------|------------------------------------------------------|
| `code`         | `string`          | Room code                                            |
| `status`       | `RoomStatus`      | `"lobby"` or `"active"`                              |
| `hostId`       | `string`          | Participant `id` of the host — **new field**         |
| `participants` | `Participant[]`   | Current player list                                  |
| `availableWords` | `string[]`      | Seed word list (unchanged)                           |
| `roles`        | `ParticipantRole[]` | Seed roles (unchanged)                             |

---

### RoomStatus (type)

```
type RoomStatus = "lobby" | "active"
```

- `"lobby"`: room exists, waiting for host to start.
- `"active"`: game in progress; added in this feature. *(Existing code only had `"lobby"`.)*

---

## Schema Changes (backend)

### `backend/src/models/game.ts`

- Add `hostId: string` field to `Room` interface.
- Extend `RoomStatus` type: `"lobby" | "active"`.
- Add `hostId: string` field to `RoomSnapshot` interface.

### `backend/src/services/roomStore.ts`

- `createRoom()`: set `room.hostId = participant.id` when constructing the room object.
- `toRoomSnapshot()`: include `hostId` in the returned snapshot.
- Add `startRoom(code: string, requestingParticipantId: string)`: validates host + player count, sets `status = "active"`, persists.

### `backend/src/api/schemas.ts`

- `createRoomSchema`: `playerName` becomes `z.string().min(1).trim()` (required, non-whitespace).
- `joinRoomSchema`: `playerName` becomes `z.string().min(1).trim()` (required, non-whitespace).
- `roomCodeParamsSchema`: add `.regex(/^[A-Z2-9]{4}$/)` refinement to `code` field.
- Add `startRoomBodySchema`: `z.object({ participantId: z.string().uuid() })` — caller identifies themselves as the requesting participant.

---

## Frontend Type Changes

### `frontend/src/services/api.ts`

- Fix `API_BASE_URL`: remove `/bug` suffix — correct value is `http://localhost:3001`.
- Add `RoomStatus` type: `"lobby" | "active"`.
- Add `hostId: string` to `RoomSnapshot` interface.
- Add `startRoom(code: string, participantId: string)` API method: `POST /rooms/:code/start`.

### `frontend/src/state/roomStore.ts`

- Add `startRoom()` method: calls `api.startRoom()`, then updates room snapshot in state.
