# Data Model: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-02

## Entities

### Room *(backend — `backend/src/models/game.ts`)*

The core aggregate stored in the in-memory `Map<string, Room>`.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | 4-char unique room code (generator avoids ambiguous chars) |
| `status` | `"lobby" \| "active"` | Transitions from `"lobby"` to `"active"` on start |
| `participants` | `Participant[]` | Ordered by join time; `participants[0]` is always the creator |
| `hostId` | `string` | UUID — `participantId` of the room creator; **NEW** |
| `createdAt` | `string` | ISO 8601 timestamp |
| `updatedAt` | `string` | ISO 8601 timestamp; updated on every mutation |

**Invariants**:
- `hostId` MUST always match the `id` of exactly one entry in `participants`.
- `participants` MUST NOT be empty while a `Room` entry exists in the store.
- `status` transitions are one-way: `"lobby"` → `"active"` (no rollback in this
  scenario).

---

### Participant *(backend — `backend/src/models/game.ts`)*

Embedded in `Room.participants`. Unchanged from starter.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID — the unique identity for this participant in this room |
| `name` | `string` | Trimmed, non-empty display name |
| `joinedAt` | `string` | ISO 8601 timestamp |

**Validation rule**: `name` MUST be non-empty after trimming whitespace (enforced by
Zod schema at the API boundary; `displayName()` fallback removed).

---

### RoomSnapshot *(shared contract — backend produces, frontend consumes)*

The read-only projection returned by every room endpoint. The frontend never holds a
mutable `Room` reference.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Room code |
| `status` | `"lobby" \| "active"` | Current room phase |
| `participants` | `Participant[]` | Full participant list |
| `hostId` | `string` | Host's `participantId`; **NEW** |
| `availableWords` | `string[]` | Starter word list (unchanged for this scenario) |
| `roles` | `ParticipantRole[]` | Starter roles (unchanged for this scenario) |

---

### Frontend RoomState *(frontend — `frontend/src/state/roomStore.ts`)*

The in-memory client state managed by the `RoomStore` class.

| Field | Type | Notes |
|-------|------|-------|
| `room` | `RoomSnapshot \| null` | Current snapshot from last successful poll/mutation |
| `participantId` | `string \| null` | This browser tab's participant UUID |
| `error` | `string \| null` | Last error message |
| `isLoading` | `boolean` | True during any in-flight request |

**Derived helper** (no new state field — computed at render time):
```ts
const isHost = room?.hostId === participantId;
```

---

## State Transitions

```
[Room created]
     │
     ▼
  status: "lobby"
  hostId: creator.id
  participants: [creator]
     │
     │  JOIN (any player)
     ▼
  participants: [..., joiner]
     │
     │  START (host only, ≥2 participants)
     ▼
  status: "active"
```

---

## Validation Rules (Zod — `backend/src/api/schemas.ts`)

| Schema | Field | Rule |
|--------|-------|------|
| `createRoomSchema` | `playerName` | `z.string().trim().min(1, "Player name is required")` |
| `joinRoomSchema` | `playerName` | `z.string().trim().min(1, "Player name is required")` |
| `startRoomSchema` *(new)* | `participantId` | `z.string().uuid("Invalid participant ID")` |
| `roomCodeParamsSchema` | `code` | `z.string().min(1)` (unchanged) |
