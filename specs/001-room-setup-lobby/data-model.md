# Data Model: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Branch**: `001-room-setup-lobby`  
**Date**: 2026-06-03

## Entity Changes

### `Room` — Modified

```typescript
// backend/src/models/game.ts
export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string; // NEW — participantId of the creator; set once at createRoom()
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

**`hostId`**:

- Type: `string` (UUID matching a `Participant.id` in the same room)
- Set: once, in `createRoom()`, to the creator's `participant.id`
- Mutated: never
- Constraints: MUST always equal a valid `Participant.id` in `room.participants`

---

### `RoomStatus` — Modified

```typescript
// backend/src/models/game.ts
export type RoomStatus = "lobby" | "playing";
//                                  ^^^^^^^^^ NEW
```

**State transitions**:

```
"lobby" ──[POST /rooms/:code/start]──► "playing"
```

- `"lobby"`: room is created and accepting participants
- `"playing"`: game has started; no new participants may join

No transition back to `"lobby"` is in scope for this scenario (restart is Scenario 4).

---

### `RoomSnapshot` — Modified

```typescript
// backend/src/models/game.ts
export interface RoomSnapshot {
  code: string;
  status: RoomStatus; // now includes "playing"
  hostId: string; // NEW — exposed to frontend
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

`hostId` is always included in the snapshot so the frontend can determine host identity without a separate lookup.

---

### `Participant` — Unchanged

```typescript
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}
```

No changes required for this scenario.

---

## Frontend Mirror Types

```typescript
// frontend/src/services/api.ts
export type RoomStatus = "lobby" | "playing"; // NEW — was literal "lobby"

export interface RoomSnapshot {
  code: string;
  status: RoomStatus; // updated
  hostId: string; // NEW
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

The frontend `RoomSnapshot` must mirror the backend exactly. The `RoomState` in `frontend/src/state/roomStore.ts` holds a `RoomSnapshot | null` — no changes needed to the store's state shape.

---

## Validation Rules

| Field                      | Rule                      | Enforced By                                                     |
| -------------------------- | ------------------------- | --------------------------------------------------------------- |
| `playerName` (create/join) | Non-empty after trim      | Frontend form + (optionally) Zod on backend                     |
| `code` (join/start)        | 4-char string, uppercased | Frontend uppercases; backend normalises via `.toUpperCase()`    |
| `status` at join           | Must equal `"lobby"`      | `joinRoom()` service function — rejects with 409 if `"playing"` |
| `status` at start          | Room must exist           | `startRoom()` service function — rejects with 404 if not found  |

---

## State Transitions Diagram

```
[No room]
    │
    │  POST /rooms  (createRoom)
    ▼
[Room: status="lobby", hostId=P1.id, participants=[P1]]
    │
    │  POST /rooms/:code/join  (joinRoom — blocked if not "lobby")
    ▼
[Room: status="lobby", participants=[P1, P2, ...]]
    │
    │  POST /rooms/:code/start  (startRoom — host clicks button)
    ▼
[Room: status="playing"]
    │
    │  All polling clients detect status="playing" → navigate /game
    ▼
[GamePage]
```
