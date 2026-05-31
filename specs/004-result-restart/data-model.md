# Data Model: Result, Restart, and Final Validation

**Feature**: `specs/004-result-restart`
**Date**: 2026-05-31

## Overview

No new fields are added to `Room` or `RoomSnapshot` for this scenario. All data required for
the result view (`guesses`, `scores`, `secretWord`, `participants`) is already present from
Scenario 3. The only data-layer change is in `restartRoom()`, which resets existing fields.

---

## Existing Entity: Room (no new fields)

```typescript
// backend/src/models/game.ts — existing shape, no changes for this scenario
interface Room {
  code: string;
  hostId: string;
  status: "lobby" | "active" | "ended";   // transitions: ended → lobby (restart)
  participants: Participant[];             // preserved on restart
  drawerId: string;                        // cleared to "" on restart
  secretWord: string;                      // cleared to "" on restart
  guesses: Guess[];                        // cleared to [] on restart
  scores: Record<string, number>;          // cleared to {} on restart
  availableWords: string[];
  roles: string[];
  createdAt: number;
  updatedAt: number;
}
```

---

## State Transition: Room.status

```
lobby  ──[start]──▶  active  ──[correct guess]──▶  ended
  ▲                                                   │
  └───────────────── [restart] ──────────────────────┘
```

The `restart` transition is the new behavior added by this scenario. It is the only path from
`"ended"` back to `"lobby"`. All other state transitions are inherited from Scenarios 2 and 3.

**Restart transition resets**:

| Field | Before (ended) | After (lobby) |
|---|---|---|
| `status` | `"ended"` | `"lobby"` |
| `drawerId` | `<uuid string>` | `""` |
| `secretWord` | `"<word>"` | `""` |
| `guesses` | `[...Guess[]]` | `[]` |
| `scores` | `{ uuid: number }` | `{}` |
| `participants` | `[...Participant[]]` | unchanged |
| `hostId` | `<uuid string>` | unchanged |
| `code` | `<room code>` | unchanged |

---

## Existing Entity: RoomSnapshot (no new fields)

```typescript
// frontend/src/services/api.ts — existing shape, no changes for this scenario
interface RoomSnapshot {
  code: string;
  hostId: string;                          // used to gate Restart button
  status: "lobby" | "active" | "ended";
  participants: Participant[];
  drawerId: string;
  guesses: Guess[];
  scores: Record<string, number>;
  secretWord?: string;                     // present when ended (revealed to all)
  wordPlaceholder?: string;                // absent when ended
  availableWords: string[];
  roles: string[];
}
```

The `hostId` field is already in the snapshot from Scenario 1. The frontend uses
`participantId === room.hostId` to determine whether to render the Restart button.

---

## `toRoomSnapshot` Behavior After Restart

After a successful restart, `room.status` is `"lobby"`. The existing `toRoomSnapshot` logic:
- `isActive = false`, `isEnded = false`
- `secretWord` branch: neither `isActive && isDrawer` nor `isEnded` → `secretWord` omitted ✅
- `wordPlaceholder` branch: `isActive && !isDrawer` is false → omitted ✅
- `guesses`: returns `[]` (empty after reset) ✅
- `scores`: returns `{}` (empty after reset) ✅
- `participants`: unchanged array ✅

No changes to `toRoomSnapshot()` are required for this scenario.

---

## New Function: `restartRoom`

```typescript
// Location: backend/src/services/roomStore.ts
function restartRoom(code: string, participantId: string): Room
```

**Guards** (in order):
1. `!room` → `HttpError(404, "Room not found")`
2. `room.status !== "ended"` → `HttpError(409, "Room is not ended")`
3. `participantId !== room.hostId` → `HttpError(403, "Only the host can restart")`

**Effect**: Mutates in-memory room, persists to `rooms` Map, returns `cloneRoom(room)`.
