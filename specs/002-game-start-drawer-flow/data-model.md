# Data Model: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-06-03

---

## Backend Model Changes

### `Room` — `backend/src/models/game.ts`

Three optional fields are added to represent round state. Fields are `undefined` in `"lobby"` status and set by `startRoom`.

```typescript
// New fields
currentDrawerId?: string;   // participant.id of the current drawer; undefined in lobby
currentWord?: string;       // secret word for this round; undefined in lobby
roundNumber?: number;       // 1-based; always 1 in this feature; undefined in lobby
```

| Field             | Lobby default | Set on `startRoom()`                                      | Constraint                                    |
| ----------------- | ------------- | --------------------------------------------------------- | --------------------------------------------- |
| `currentDrawerId` | `undefined`   | `room.hostId`                                             | Must equal an existing participant's id       |
| `currentWord`     | `undefined`   | `STARTER_WORDS[(roundNumber - 1) % STARTER_WORDS.length]` | Must be a member of `STARTER_WORDS`           |
| `roundNumber`     | `undefined`   | `1`                                                       | Always `1` in this feature; never incremented |

### `RoomSnapshot` — `backend/src/models/game.ts`

Two optional fields are added to the public snapshot type. `currentWord` is conditionally populated by `toRoomSnapshot`.

```typescript
// New fields
currentDrawerId?: string;           // always included when status = "playing"
currentWord?: string | null;        // included only when viewer is the drawer; null otherwise
```

---

## `toRoomSnapshot` — Redaction Logic

`toRoomSnapshot(room, viewerParticipantId?)` in `backend/src/services/roomStore.ts`:

```
if room.status === "playing":
  snapshot.currentDrawerId = room.currentDrawerId

  if viewerParticipantId === room.currentDrawerId:
    snapshot.currentWord = room.currentWord    // full word to drawer
  else:
    snapshot.currentWord = null               // redacted for guessers & unauthenticated
```

---

## `startRoom` — Round Initialisation

`startRoom(code)` in `backend/src/services/roomStore.ts`:

```
room.status = "playing"
room.roundNumber = 1
room.currentDrawerId = room.hostId
room.currentWord = STARTER_WORDS[(1 - 1) % STARTER_WORDS.length]   // STARTER_WORDS[0]
room.updatedAt = now()
return toRoomSnapshot(cloneRoom(room))   // no viewerParticipantId — snapshot returned to start route, which is fine as the host is the drawer
```

> Note: The `POST /:code/start` route does not pass a `participantId` to `toRoomSnapshot` on start. The `startRoom` return value snapshot will have `currentWord = null` (redacted). The host immediately polls `GET /rooms/:code?participantId=…` and receives the word on the next fetch. This is acceptable and avoids changing the start route signature.

---

## Frontend Interface Changes

### `RoomSnapshot` — `frontend/src/services/api.ts`

```typescript
// New optional fields
currentDrawerId?: string;
currentWord?: string | null;
```

---

## State Transitions

```
"lobby"
  Room.currentDrawerId = undefined
  Room.currentWord     = undefined
  Room.roundNumber     = undefined

        ↓ POST /rooms/:code/start

"playing"
  Room.currentDrawerId = room.hostId          (e.g. "uuid-abc")
  Room.currentWord     = "rocket"             (STARTER_WORDS[0])
  Room.roundNumber     = 1
```

---

## Validation Rules

| Rule                                                                                            | Source                   |
| ----------------------------------------------------------------------------------------------- | ------------------------ |
| `currentDrawerId` MUST equal `room.hostId` for round 1                                          | FR-002                   |
| `currentWord` MUST be a member of `STARTER_WORDS`                                               | FR-005                   |
| `roundNumber` MUST equal `1`; MUST NOT be incremented                                           | FR-006, Q5 clarification |
| `toRoomSnapshot` MUST include `currentWord` only when `viewerParticipantId === currentDrawerId` | FR-007, FR-008           |
| `toRoomSnapshot` MUST set `currentWord = null` when viewer is not the drawer                    | FR-008                   |
