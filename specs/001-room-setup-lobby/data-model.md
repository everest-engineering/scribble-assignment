# Data Model: Room Setup and Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-05-29

## Entities

### Room *(backend/src/models/game.ts)*

Represents an isolated in-memory game session.

| Field | Type | Rules |
|-------|------|-------|
| `code` | `string` | 4-char uppercase alphanumeric; unique across all rooms; generated on create |
| `hostId` | `string` | **NEW** — UUID of the creating participant; set once on room creation; immutable |
| `status` | `RoomStatus` | **EXPANDED** — `"lobby" \| "active" \| "ended"`; starts as `"lobby"` |
| `participants` | `Participant[]` | Ordered by join time; never empty (creator is always first)|
| `createdAt` | `string` | ISO 8601 timestamp |
| `updatedAt` | `string` | ISO 8601 timestamp; updated on any mutation |

### RoomStatus *(type alias)*

```
"lobby"   — room is accepting new participants; game not started
"active"  — game is in progress; no new participants accepted
"ended"   — game has concluded (future scenarios)
```

### Participant *(backend/src/models/game.ts — no change to fields)*

| Field | Type | Rules |
|-------|------|-------|
| `id` | `string` | UUID; generated on join; unique within process lifetime |
| `name` | `string` | Trimmed; 1–20 characters; duplicates allowed within a room |
| `joinedAt` | `string` | ISO 8601 timestamp |

### RoomSnapshot *(backend/src/models/game.ts — viewer-scoped projection)*

Returned by all endpoints; safe to send to clients.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Room code |
| `hostId` | `string` | **NEW** — the participant ID of the host; always present |
| `status` | `RoomStatus` | Current room status |
| `participants` | `Participant[]` | Full list (all viewers see all names in lobby) |
| `availableWords` | `string[]` | From `STARTER_WORDS`; present for lobby but only meaningful in gameplay |
| `roles` | `ParticipantRole[]` | Placeholder; populated in Scenario 002 |

### RoomSessionResponse *(unchanged shape, richer snapshot)*

Returned on create and join.

```
{
  participantId: string   // the caller's own participant ID
  room: RoomSnapshot      // full snapshot (now includes hostId)
}
```

## State Transitions

```
[create room]
     │
     ▼
  "lobby"  ◄─── new participants join (status = lobby)
     │
     │  host calls POST /rooms/:code/start
     │  (≥2 participants, requester = hostId)
     ▼
  "active"
     │
     │  (Scenario 002+)
     ▼
  "ended"
```

## Validation Rules

### Backend (Zod, in schemas.ts)

| Schema | Field | Rule |
|--------|-------|------|
| `createRoomSchema` | `playerName` | `z.string().trim().min(1).max(20)` — required |
| `joinRoomSchema` | `playerName` | `z.string().trim().min(1).max(20)` — required |
| `startGameSchema` | `participantId` | `z.string().uuid()` — required |
| `roomCodeParamsSchema` | `code` | `z.string()` — URL param, case-normalized to uppercase in handler |

### Frontend (in-component, JoinRoomPage.tsx)

| Field | Rule |
|-------|------|
| Room code input | Trimmed, non-empty, `/^[a-zA-Z0-9]+$/` — must match before API call |
| Name input | Trimmed, non-empty — mirrors backend rule |

## Isolation Guarantee

Rooms are stored in a module-level `Map<string, Room>` in `roomStore.ts`. Each room's code is unique. No room can read or mutate another room's participants or state. All returned objects are deep-cloned via `structuredClone` before leaving the service layer.
