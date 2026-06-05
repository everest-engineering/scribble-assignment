# Phase 1 Data Model: Room Setup & Lobby

In-memory only (no persistence). Types live in `backend/src/models/game.ts`; the frontend mirrors the
snapshot shape in `frontend/src/services/api.ts`.

## Entities

### Participant

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Assigned at create/join; the client's identity for this room |
| `name` | `string` | Display name (name validation hardened in Group 2) |
| `joinedAt` | `string` (ISO) | Existing field; unchanged |

### Room (server-side, authoritative)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Canonical uppercase, unique among active rooms |
| `status` | `"lobby" \| "started"` | **CHANGED** from `"lobby"`-only; `started` set by start endpoint |
| `hostId` | `string` | **NEW** — participant id of the creator (FR-002) |
| `participants` | `Participant[]` | Ordered; creator is first |
| `createdAt` | `string` (ISO) | Existing |
| `updatedAt` | `string` (ISO) | Existing; bumped on mutation |

### RoomSnapshot (sent to clients)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Canonical uppercase (FR-005a) |
| `status` | `"lobby" \| "started"` | Drives lobby→game navigation |
| `hostId` | `string` | **NEW** — lets any client identify the host (FR-003) |
| `participants` | `Array<Participant & { isHost: boolean }>` | **NEW** `isHost` derived from `hostId` |
| `availableWords` | `string[]` | Present in starter; not used by this group |
| `roles` | `string[]` | Present in starter; not used by this group |

> Note: `viewerParticipantId` becomes meaningful — used to compute the viewer's own `isHost`. Secret
> word hiding is NOT added here (Group 2).

## Validation Rules

| Rule | Where | Requirement |
|------|-------|-------------|
| Room code trimmed + uppercased before lookup | Edge (schema/handler) | FR-005 |
| Empty/whitespace code rejected (400) | Edge (schema) | FR-007 |
| Unknown code rejected (404 "room not found") | Handler | FR-006 |
| Start requires `participantId === room.hostId` (else 403) | `startRoom` | FR-012, FR-014 |
| Start requires `participants.length >= 2` (else 422) | `startRoom` | FR-013, FR-015 |
| Start sets `status = "started"`, assigns NO role/word | `startRoom` | FR-017, FR-018 |
| Already `started` → idempotent 200 with current room | `startRoom` | Avoid double-start errors |

## State Transitions (Room.status)

```text
        create
   ─────────────▶  lobby
                     │
                     │ POST /rooms/:code/start
                     │   (host AND participants >= 2)
                     ▼
                  started   ──▶ (Group 2+ takes over: drawer/word/round)
```

- Invalid start attempts (non-host, <2 players) do **not** change status.
- Valid re-start when already `started` is **idempotent** (return current room, no error).
- No transition back to `lobby` in this group (restart belongs to Group 4).

## startRoom result shape (store layer)

```typescript
type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "too-few-players" };
```

Route handler maps `reason` → HTTP status (404 / 403 / 422).

## Isolation Invariant

For any two rooms A and B with distinct codes: any create/join/start on A leaves B's `participants`,
`status`, and `hostId` unchanged. Enforced by the keyed `Map` and covered by a unit test (FR-008,
SC-005).
