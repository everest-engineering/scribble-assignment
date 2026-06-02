# Data Model: Room Setup & Lobby

**Feature**: Room Setup & Lobby
**Date**: 2026-06-02

---

## Changes to Existing Entities

### Room *(backend/src/models/game.ts)*

Add `hostId` field — the `id` of the participant who created the room.

```
Room {
  code:         string        // 4-char alphanumeric, unique
  hostId:       string        // NEW — UUID of the creating participant
  status:       RoomStatus    // "lobby" | "active"  (expand union for start-game)
  participants: Participant[]
  createdAt:    string        // ISO timestamp
  updatedAt:    string        // ISO timestamp
}
```

**Validation rules**:
- `hostId` MUST be set at creation time and MUST NOT change.
- `status` transitions: `"lobby"` → `"active"` only (via start-game). No reverse transition in this scenario.

---

### RoomSnapshot *(backend/src/models/game.ts)*

Add `hostId` to the client-facing snapshot so the frontend can determine host status without server-side session logic.

```
RoomSnapshot {
  code:             string
  hostId:           string        // NEW — exposed to all clients in the room
  status:           RoomStatus
  participants:     Participant[]
  availableWords:   string[]
  roles:            ParticipantRole[]
}
```

---

### Participant *(backend/src/models/game.ts — no change)*

No structural changes in this scenario. Identity is tracked by `id` (UUID).

```
Participant {
  id:       string   // UUID
  name:     string   // trimmed, non-empty
  joinedAt: string   // ISO timestamp
}
```

---

### RoomStatus *(backend/src/models/game.ts)*

Expand the union to include `"active"` for the start-game transition, even though the game screen rendering belongs to a later scenario.

```
type RoomStatus = "lobby" | "active"
```

---

## Frontend State *(frontend/src/state/roomStore.ts)*

The frontend `RoomSnapshot` interface (duplicated in `frontend/src/services/api.ts`) must mirror the backend change:

```
RoomSnapshot {
  code:           string
  hostId:         string   // NEW
  status:         "lobby" | "active"
  participants:   Participant[]
  availableWords: string[]
  roles:          ParticipantRole[]
}
```

The `roomStore` already holds `participantId` from the create/join response. Comparing `participantId === room.hostId` is sufficient to gate host-only actions on the frontend.

---

## State Transitions

```
[not created]
     │
     ▼ POST /rooms
  "lobby"  ◄─── players join via POST /rooms/:code/join
     │
     ▼ POST /rooms/:code/start  (host only, ≥2 participants)
  "active"
```
