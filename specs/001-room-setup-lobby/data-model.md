# Data Model: Room Setup & Lobby Navigation

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02

---

## Entities

### Room

Held in-memory server-side in a `Map<string, Room>`.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | 4-char uppercase alphanumeric; unique; generated at creation |
| `status` | `"lobby" \| "in-progress"` | Current room phase; starts as `"lobby"` |
| `hostId` | `string` | `id` of the participant who created the room (immutable after creation) |
| `participants` | `Participant[]` | Ordered by join time; max 4 entries |
| `createdAt` | `string` | ISO 8601 timestamp |
| `updatedAt` | `string` | ISO 8601 timestamp; updated on every mutation |

**Validation rules**:
- `participants.length <= 4` enforced in `joinRoom()` before pushing a new participant
- `status` transition: `"lobby"` → `"in-progress"` only; no reverse transition
- `hostId` must reference a `participant.id` that is currently in `participants[]`

---

### Participant

Nested inside `Room.participants`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID v4; unique across all rooms |
| `name` | `string` | Player-supplied; trimmed; min 1 char after trim |
| `joinedAt` | `string` | ISO 8601 timestamp |

**Validation rules**:
- `name.trim().length >= 1` — enforced at Zod schema level and frontend form level

---

### RoomSnapshot (wire format — read-only projection)

Returned by all room endpoints. Derived from `Room`.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Room identifier for sharing |
| `status` | `"lobby" \| "in-progress"` | Used by frontend polling to detect game start |
| `hostId` | `string` | Used by frontend to conditionally enable Start Game button |
| `participants` | `ParticipantSnapshot[]` | Public participant info (no internal fields) |
| `availableWords` | `string[]` | From `STARTER_WORDS` seed — passed through unchanged |
| `roles` | `ParticipantRole[]` | From `STARTER_ROLES` seed — passed through unchanged |

---

### ParticipantSnapshot

Sub-entity within `RoomSnapshot.participants`. Identical to `Participant` in this feature.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID |
| `name` | `string` | Display name |
| `joinedAt` | `string` | ISO 8601 |

---

## State Transitions

### Room Status FSM

```
       createRoom()
            │
            ▼
         [lobby]
            │
   startRoom() — host only, participants >= 2
            │
            ▼
      [in-progress]
```

No transition back to `lobby`. No terminal/closed state in this feature scope.

---

## Shared Schema Location

All Zod schemas and derived TypeScript types live in `shared/schemas/`.

```
shared/
└── schemas/
    ├── room.ts          # Room, RoomSnapshot, Participant Zod schemas + inferred types
    └── index.ts         # Re-exports
```

Both `backend/src/` and `frontend/src/services/api.ts` import from `shared/schemas/`.

---

## Changes to Existing Models

| File | Change | Reason |
|------|--------|--------|
| `backend/src/models/game.ts` | Add `hostId: string` to `Room`; extend `RoomStatus` to `"lobby" \| "in-progress"`; add `hostId` to `RoomSnapshot` | Host tracking (R-001), game start detection (R-007) |
| `backend/src/api/schemas.ts` | Tighten `playerName` and `roomCode` validation to `.trim().min(1)` | FR-003, FR-004 |
| `frontend/src/services/api.ts` | Fix base URL bug (`/bug` suffix); add Zod parse on responses; import types from `shared/schemas/` | R-010, Principle VI |
| `frontend/src/state/roomStore.ts` | Add `startGame()` method; remove `withLoading` wrapper from `fetchRoom` (polling should be silent) | FR-009, FR-011 |
