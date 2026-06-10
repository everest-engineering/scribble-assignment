# Phase 1 Data Model: Room Setup & Lobby

All entities live in process memory inside `backend/src/services/roomStore.ts`. There is no database (Constitution Principle II). This document describes the in-memory shape and the snapshot shape sent over HTTP.

## Entities

### Room

The authoritative server-side record. One per active room, keyed by `code` in a `Map<string, Room>`.

| Field                | Type                  | Notes                                                                 |
| -------------------- | --------------------- | --------------------------------------------------------------------- |
| `code`               | `string`              | 4-char uppercase, alphabet excludes ambiguous chars. Unique while active. |
| `status`             | `"lobby"`             | Only `lobby` is in scope for this feature.                            |
| `participants`       | `Participant[]`       | Ordered by join time, ascending. Length is the gate for Start Game.   |
| `hostParticipantId`  | `string`              | **NEW.** Set to the creator's participant id at `createRoom`. Immutable for this feature (no host transfer). |
| `createdAt`          | `string` (ISO 8601)   | Set once at creation.                                                 |
| `updatedAt`          | `string` (ISO 8601)   | Refreshed on every mutation.                                          |

Invariants:

- `participants` MUST contain exactly one participant whose `id === hostParticipantId`.
- `code` MUST be normalized (trimmed, uppercased) before insertion or lookup (FR-007).
- `participants.length >= 2` is the precondition for `startRoom` (FR-015, FR-017).

### Participant

A player belonging to exactly one room.

| Field      | Type                | Notes                                                            |
| ---------- | ------------------- | ---------------------------------------------------------------- |
| `id`       | `string` (UUID v4)  | Server-issued. The opaque credential used by the client (FR-018). |
| `name`     | `string`            | 1–24 chars after trim. Display only; not unique.                 |
| `joinedAt` | `string` (ISO 8601) | Set once on creation.                                            |

Invariants:

- `name` is rejected if empty or whitespace-only after trim (FR-005).
- `id` is the only credential in the system (Principle II, FR-018).

### RoomSnapshot (wire shape sent to clients)

Built by `toRoomSnapshot(room, viewerParticipantId)`. The viewer id is used to derive `viewerIsHost`, `canStart`, and per-row `isHost` for the requesting client.

| Field                | Type                            | Notes                                                                       |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `code`               | `string`                        | Same as `Room.code`.                                                        |
| `status`             | `"lobby"`                       |                                                                             |
| `participants`       | `ParticipantView[]`             | Same order as `Room.participants`.                                          |
| `hostParticipantId`  | `string`                        | **NEW.** Mirrors `Room.hostParticipantId` so the UI can render host badges. |
| `viewerIsHost`       | `boolean`                       | **NEW.** True iff `viewerParticipantId === hostParticipantId`.              |
| `canStart`           | `boolean`                       | **NEW.** True iff `viewerIsHost && participants.length >= 2`.               |
| `availableWords`     | `string[]`                      | Existing scaffold field, untouched by this feature.                         |
| `roles`              | `("drawer" \| "guesser")[]`     | Existing scaffold field, untouched by this feature.                         |

#### ParticipantView

| Field      | Type                | Notes                                                       |
| ---------- | ------------------- | ----------------------------------------------------------- |
| `id`       | `string`            | Same as `Participant.id`.                                   |
| `name`     | `string`            |                                                             |
| `joinedAt` | `string` (ISO 8601) |                                                             |
| `isHost`   | `boolean`           | **NEW.** True iff `id === hostParticipantId`.               |

`viewerIsHost` and `canStart` are convenience booleans derived per request. The client MUST NOT trust them for authorization — they are display hints only. The authoritative host check happens server-side on `POST /rooms/:code/start` (FR-016).

## State transitions

Only `Room.status === "lobby"` is in scope. The Start Game endpoint validates host and participant count but, for this feature, does not yet transition `status`; that transition belongs to the gameplay feature. The endpoint exists in this slice solely to enforce the host / 2-player guard (FR-014–FR-017) and acknowledge intent.

```text
(create) ──► lobby ──► [start gated] ──► (lobby, ack only — gameplay state machine deferred)
```

## Identity & isolation rules

- A room's data is reachable only by its `code`. There is no list-all-rooms endpoint (FR-008).
- A `participantId` is bound to the room it was issued for. Sending it to a different room's endpoint is treated as "not the host" (FR-016).
- Identity is held in the client's `sessionStorage` per tab so a refresh on `/lobby` rehydrates without server help.
