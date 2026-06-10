# Data Model: Game Start & Drawer Flow

## Changes to Existing Entities

### Room (backend: `backend/src/models/game.ts`)

The `Room` interface gains two optional fields and `RoomStatus` gains a new member:

```
RoomStatus: "lobby" | "playing"   // was: "lobby"

Room {
  code:        string              // unchanged
  status:      RoomStatus          // now also "playing"
  participants: Participant[]       // unchanged
  createdAt:   string              // unchanged
  updatedAt:   string              // unchanged
  drawerName?: string              // NEW — set on game start; absent in lobby
  secretWord?: string              // NEW — set on game start; absent in lobby; NEVER sent to guessers
}
```

**Invariants**:
- `drawerName` and `secretWord` are always set together (both absent or both present).
- When `status === "playing"`, both fields must be present.
- When `status === "lobby"`, both fields must be absent.

### RoomSnapshot (backend: `backend/src/models/game.ts` · frontend: `frontend/src/services/api.ts`)

Two new fields are added; `secretWord` is conditionally populated:

```
RoomSnapshot {
  code:         string              // unchanged
  status:       RoomStatus          // now also "playing"
  participants: Participant[]        // unchanged
  availableWords: string[]          // unchanged
  roles:        ParticipantRole[]   // unchanged
  drawerName?:  string              // NEW — present when status === "playing"
  secretWord?:  string              // NEW — present ONLY when viewer is the drawer
}
```

**Population rule**:
- `drawerName` is included whenever `status === "playing"`.
- `secretWord` is included only when `viewerParticipantId` resolves to a participant whose `name === drawerName`.

---

## State Transitions

```
lobby  ──[POST /rooms/:code/start]──►  playing
```

- The only valid transition is `lobby → playing`.
- Attempting to start an already-playing room returns HTTP 409.
- No transition back to lobby is defined in this feature.

---

## Drawer Assignment Rule

- The drawer is the participant at `room.participants[0]` (first by insertion order, i.e., earliest `joinedAt`).
- `drawerName` is set to `participants[0].name`.

## Word Selection Rule

- `secretWord` is set to `STARTER_WORDS[0]`, which is `"rocket"`.
- This is deterministic and does not consume or advance any word-list cursor.
