# Data Model: Room Setup & Lobby

**Feature**: 001-scribble-game — Scenario 1
**Date**: 2026-06-05

---

## Backend Models (`backend/src/models/game.ts`)

### RoomStatus

```
"lobby" | "active"
```

- `"lobby"` — room created, waiting for players and host start.
- `"active"` — game started; all players navigated to game screen.

*Change from starter*: adds `"active"` to the union.

---

### Participant

| Field       | Type     | Constraints                                  |
|-------------|----------|----------------------------------------------|
| `id`        | `string` | UUID, generated on join/create               |
| `name`      | `string` | Trimmed, non-empty (min 1 char after trim)   |
| `joinedAt`  | `string` | ISO 8601 timestamp                           |

*No change from starter* — host identity is stored on `Room`, not on `Participant`.

---

### Room

| Field          | Type            | Constraints                              |
|----------------|-----------------|------------------------------------------|
| `code`         | `string`        | 4 chars, unique, from unambiguous charset|
| `status`       | `RoomStatus`    | `"lobby"` on create; `"active"` on start |
| `participants` | `Participant[]` | Append-only during lobby phase           |
| `hostId`       | `string`        | Participant id of creator; immutable     |
| `createdAt`    | `string`        | ISO 8601 timestamp                       |
| `updatedAt`    | `string`        | ISO 8601, updated on every mutation      |

*Change from starter*: adds `hostId`.

---

### RoomSnapshot (API response shape)

| Field            | Type            | Notes                                      |
|------------------|-----------------|--------------------------------------------|
| `code`           | `string`        | Room code                                  |
| `status`         | `RoomStatus`    | Current room state                         |
| `participants`   | `Participant[]` | All joined participants                    |
| `hostId`         | `string`        | Echoed from Room for client-side host check|
| `availableWords` | `string[]`      | Starter word list (unchanged)              |
| `roles`          | `ParticipantRole[]` | Starter roles (unchanged)             |

*Change from starter*: adds `hostId`.

---

## Validation Rules

| Field        | Rule                                              | Error message               |
|--------------|---------------------------------------------------|-----------------------------|
| `playerName` | Required; trim; min 1 char after trim             | "Player name cannot be empty"|
| `code` (join)| Required; 4 chars after `.toUpperCase()`          | Existing 404 from backend   |
| `participantId` (start) | Required; must match `room.hostId`   | 403 "Only the host can start"|
| Participant count (start) | Must be ≥ 2                          | 400 "Need at least 2 players"|

---

## State Transitions

```
[create room]
     │
     ▼
  "lobby"  ◄──── [players join via POST /rooms/:code/join]
     │
     │  [host calls POST /rooms/:code/start]
     │  (participantId == hostId AND participants.length >= 2)
     ▼
  "active"
```

---

## Frontend State (`frontend/src/state/roomStore.ts`)

The `RoomStore` class already holds `participantId` and `room`. No new fields are needed for Scenario 1. The host check is a derived value:

```
isHost = state.participantId === state.room?.hostId
```

`RoomSnapshot` in `frontend/src/services/api.ts` gains `hostId: string` to mirror the backend.
