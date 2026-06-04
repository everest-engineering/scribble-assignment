# Data Model: Room Setup & Lobby

## Backend — `backend/src/models/game.ts`

### `RoomStatus` (extended)

```
"lobby" | "playing" | "finished"
```

Previously only `"lobby"`. Extended to support game lifecycle transitions.

---

### `Participant` (unchanged)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Unique identity, generated server-side |
| `name` | `string` | Trimmed, non-empty; validated by Zod |
| `joinedAt` | `string` (ISO 8601) | Server timestamp at join time |

---

### `Room` (extended)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | 4-char uppercase alphanumeric, unique |
| `hostId` | `string` | **NEW** — `participants[0].id` at creation |
| `status` | `RoomStatus` | Transitions: `lobby` → `playing` → `finished` |
| `participants` | `Participant[]` | Append-only during lobby phase |
| `createdAt` | `string` (ISO 8601) | Set once at creation |
| `updatedAt` | `string` (ISO 8601) | Updated on any mutation |

**Validation rules**:
- `hostId` MUST equal an existing `participant.id`
- `participants` length MUST be ≥ 1 at all times
- Status transition `lobby → playing` requires `participants.length >= 2` and caller is host

---

### `RoomSnapshot` (extended)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Room code |
| `hostId` | `string` | **NEW** — forwarded from `Room.hostId` |
| `status` | `RoomStatus` | Current room status (extended union) |
| `participants` | `Participant[]` | Full list |
| `availableWords` | `string[]` | Seed words (unchanged) |
| `roles` | `ParticipantRole[]` | Seed roles (unchanged) |

---

## Backend — `backend/src/api/schemas.ts`

### `createRoomSchema` (updated)

```
{ playerName: string (trimmed, min 1) }
```

`playerName` changes from `optional` to required, trimmed, min-length 1.

### `joinRoomSchema` (updated)

```
{ playerName: string (trimmed, min 1) }
```

Same change as `createRoomSchema`.

### `startGameSchema` (new)

```
{ participantId: string }
```

Caller must supply their `participantId`; backend validates it matches `room.hostId`.

---

## Frontend — `frontend/src/services/api.ts`

### `RoomSnapshot` (updated)

```typescript
interface RoomSnapshot {
  code: string;
  hostId: string;           // NEW
  status: "lobby" | "playing" | "finished";  // extended
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### `api.startGame` (new method)

```typescript
startGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>
```

---

## Frontend — `frontend/src/state/roomStore.ts`

### `RoomState` (extended)

| Field | Type | Notes |
|-------|------|-------|
| `room` | `RoomSnapshot \| null` | Existing |
| `participantId` | `string \| null` | Existing |
| `error` | `string \| null` | Existing — used for action errors |
| `pollError` | `string \| null` | **NEW** — non-fatal, shown inline in lobby |
| `isLoading` | `boolean` | Existing |

### New `RoomStore` methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `startPolling` | `(intervalMs: number) => void` | Start `setInterval` calling `fetchRoom` silently |
| `stopPolling` | `() => void` | `clearInterval`, clears poll timer ref |
| `startGame` | `() => Promise<RoomSnapshot>` | Calls `POST /rooms/:code/start`, updates state |

---

## State Transitions

```
Room lifecycle:
  lobby  ──[host starts, ≥2 players]──▶  playing  ──[round ends]──▶  finished
                                                                           │
                                                             [host restarts]
                                                                           ▼
                                                                         lobby  (Scenario 4, out of scope here)

LobbyPage polling:
  mount ──▶ startPolling(2000) ──▶ every 2s: fetchRoom()
              │                         │
              │                    status == "playing"?
              │                         │ yes
              │                         ▼
              │                    navigate("/game")
              ▼
           unmount ──▶ stopPolling()
```
