# Data Model: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer — Scenario 2
**Date**: 2026-06-05

---

## Backend Models (`backend/src/models/game.ts`)

### Room (extended)

| Field          | Type            | Added by    | Notes                                          |
|----------------|-----------------|-------------|------------------------------------------------|
| `code`         | `string`        | Scenario 1  | 4-char unique code                             |
| `status`       | `RoomStatus`    | Scenario 1  | `"lobby" \| "active"`                          |
| `hostId`       | `string`        | Scenario 1  | Participant id of creator                      |
| `participants` | `Participant[]` | Scenario 1  | Append-only during lobby                       |
| `createdAt`    | `string`        | Scenario 1  | ISO 8601                                       |
| `updatedAt`    | `string`        | Scenario 1  | ISO 8601                                       |
| **`drawerId`** | `string`        | **Scenario 2** | Set to `hostId` on `startRoom()`; id of the drawer |
| **`currentWord`** | `string`     | **Scenario 2** | Set to `STARTER_WORDS[0]` ("rocket") on `startRoom()` |

*`drawerId` and `currentWord` are only meaningful when `status === "active"`.*

---

### RoomSnapshot (API response shape, extended)

| Field            | Type       | Added by    | Notes                                                   |
|------------------|------------|-------------|---------------------------------------------------------|
| `code`           | `string`   | Scenario 1  | Room code                                               |
| `status`         | `RoomStatus` | Scenario 1 | Current room state                                     |
| `hostId`         | `string`   | Scenario 1  | Host participant id                                     |
| `participants`   | `Participant[]` | Scenario 1 | All joined participants                             |
| `availableWords` | `string[]` | Starter     | Full word list                                          |
| `roles`          | `ParticipantRole[]` | Starter | Role list                                        |
| **`drawerId`**   | `string \| undefined` | **Scenario 2** | Included when `status === "active"`         |
| **`currentWord`** | `string \| undefined` | **Scenario 2** | Included **only** when viewer is drawer   |

---

### Participant (unchanged)

No changes from Scenario 1.

---

## Validation & Filtering Rules

| Rule | Location | Behaviour |
|------|----------|-----------|
| `drawerId` set on start | `startRoom()` in `roomStore.ts` | `room.drawerId = room.hostId` |
| `currentWord` set on start | `startRoom()` in `roomStore.ts` | `room.currentWord = STARTER_WORDS[0]` |
| Word included in snapshot | `toRoomSnapshot()` | Only when `viewerParticipantId === room.drawerId` |
| `drawerId` included in snapshot | `toRoomSnapshot()` | Always included when `status === "active"` |

---

## State Transitions (extended from Scenario 1)

```
[create room]
     │
     ▼
  "lobby"  ◄──── [players join]
     │
     │  [host calls POST /rooms/:code/start]
     │  Sets: status = "active", drawerId = hostId, currentWord = STARTER_WORDS[0]
     ▼
  "active"
     │
     │  (Scenario 4 — restart, out of scope for Scenario 2)
     ▼
  "lobby"  (reset)
```

---

## Frontend State (`frontend/src/services/api.ts`)

`RoomSnapshot` gains two optional fields mirroring the backend:
- `drawerId?: string`
- `currentWord?: string`

No new `RoomStore` methods needed. `GamePage` derives `isDrawer` from
`participantId === room.drawerId`.
