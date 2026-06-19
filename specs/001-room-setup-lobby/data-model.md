# Phase 1 Data Model: Room Setup & Lobby

Scope: the in-memory model backing Scenario 1. Changes are **additive** to the starter
(`backend/src/models/game.ts`, `backend/src/services/roomStore.ts`). New/changed fields are marked.

## Entities

### Participant *(unchanged)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Stable identity; basis for host check. |
| `name` | `string` | Display name. Trimming/blank-rejection is **Group 2**, not here. |
| `joinedAt` | `string` (ISO) | Creation timestamp. |

### Room

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `code` | `string` | unchanged | Unique 4-char code; map key; matched case-insensitively (FR-006). |
| `status` | `"lobby" \| "active"` | **widened** | Was `"lobby"` only. `"active"` = game started (FR-013). |
| `hostId` | `string` | **new** | `id` of the creator participant (FR-001). Immutable for room lifetime. |
| `participants` | `Participant[]` | unchanged | Ordered; creator is `participants[0]` and the host. |
| `createdAt` | `string` (ISO) | unchanged | |
| `updatedAt` | `string` (ISO) | unchanged | Bumped on join/start. |

### RoomSnapshot *(viewer-facing projection)*

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `code` | `string` | unchanged | |
| `status` | `"lobby" \| "active"` | **widened** | Drives lobby auto-advance (FR-013). |
| `hostId` | `string` | **new** | Lets the client mark the host and derive `isHost` (FR-001, FR-010/011). |
| `participants` | `Participant[]` | unchanged | Drives the participant list + count gate. |
| `availableWords` | `string[]` | unchanged | Seed data; consumed by Group 2, carried through now. |
| `roles` | `ParticipantRole[]` | unchanged | Seed data; consumed by Group 2. |

> Note: `toRoomSnapshot(room, viewerParticipantId)` keeps its `viewerParticipantId` parameter. Group 1 does
> not yet vary the snapshot per viewer (it only adds `hostId`/`status`); the parameter remains the seam that
> Group 2 uses for drawer-only word visibility.

## Derived values (client)

- `isHost = (snapshot.hostId === store.participantId)`
- `canStart = isHost && snapshot.participants.length >= 2`
- `isStarted = (snapshot.status === "active")` → triggers navigation to `/game`.

## State machine (Room.status)

```text
        create room
   ─────────────────────▶  ┌─────────┐
                            │  lobby  │  participants join (status unchanged)
                            └─────────┘
                                 │  POST /rooms/:code/start
                                 │  guard: requester == hostId  (else 403)
                                 │  guard: participants >= 2     (else 409)
                                 ▼
                            ┌─────────┐
                            │ active  │  (terminal for Group 1; later groups extend)
                            └─────────┘
```

- No transition out of `active` exists in Group 1 (restart is Group 4).
- Invalid start requests do **not** change state (remain `lobby`).

## Validation rules (traced to FRs)

| Rule | Where | FR |
|------|-------|----|
| Creator becomes host on create | `createRoom()` sets `hostId` | FR-001 |
| Unique code generated & surfaced | existing `generateUniqueCode()` | FR-002 |
| Join adds non-host participant | existing `joinRoom()` | FR-003 |
| Empty/whitespace code rejected ("Enter a room code.") | client guard in `JoinRoomPage` | FR-004 |
| Unknown code rejected ("No room with that code.") | `joinRoom()` returns null → 404 message | FR-005 |
| Case-insensitive code match | existing `.toUpperCase()` in routes | FR-006 |
| Rooms isolated by code | `Map<code, Room>`; no cross-room state | FR-007 |
| Start requires host | `startGame()` checks `participantId === hostId` → 403 | FR-012 |
| Start requires ≥2 players | `startGame()` checks count → 409 | FR-010, FR-012 |
| Start flips to `active`, observable to all | `status = "active"`; polled by all clients | FR-013 |
