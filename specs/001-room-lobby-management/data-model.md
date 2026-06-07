# Phase 1 Data Model: Room & Lobby Management

All types live in `backend/src/models/game.ts` and the in-memory store in `backend/src/services/roomStore.ts`. Frontend mirrors the snapshot shape in `frontend/src/services/api.ts`. **No persistence** — state is a single `Map<code, Room>` cleared on restart.

## Constants

```ts
const MAX_PLAYERS = 8;              // FR-016
const PRESENCE_TIMEOUT_MS = 10_000; // FR-010a (departure after ~10s of no poll)
const POLL_INTERVAL_MS = 2_000;     // FR-010  (frontend lobby poll cadence)
```

## Entities

### Participant

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `id` | `string` (UUID) | existing | Identity token for the session (no auth). |
| `name` | `string` | existing | Trimmed; defaults to `"Player"`; disambiguated within a room (`"Name (2)"`). FR-017 |
| `joinedAt` | `string` (ISO) | existing | Set on join/create; used for stable ordering. |
| `lastSeenAt` | `string` (ISO) | **NEW** | Refreshed on create/join and on each poll by this participant. Drives departure pruning. FR-010a |

### Room

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `code` | `string` | existing | Unique 4-char uppercase alphanumeric; case-insensitive match. FR-001, FR-007 |
| `status` | `RoomStatus` | existing (extended) | `"lobby" \| "playing"`. `"playing"` added for the start transition. FR-013 |
| `hostId` | `string` | **NEW** | `participantId` of the creator; authority for start control. FR-002, FR-011 |
| `participants` | `Participant[]` | existing | Members of this room only (isolation via per-code Map). FR-008, FR-009 |
| `createdAt` | `string` (ISO) | existing | — |
| `updatedAt` | `string` (ISO) | existing | Touched on any mutation. |

### RoomSnapshot (returned to clients)

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `code` | `string` | existing | |
| `status` | `RoomStatus` | existing (extended) | Frontend navigates to `/game` when `"playing"`. |
| `hostId` | `string` | **NEW** | Lets client render Host badge and gate the Start control. |
| `participants` | `Participant[]` | existing | After lazy pruning of stale members. `lastSeenAt` may be included; not used by UI. |
| `availableWords` | `string[]` | existing | Unchanged (seed data; for later gameplay increment). |
| `roles` | `ParticipantRole[]` | existing | Unchanged. |

`RoomSessionResponse` (`{ participantId, room: RoomSnapshot }`) is unchanged in shape.

## Validation Rules

| Rule | Where | FR |
|------|-------|----|
| Room code required (reject empty/whitespace) | Client (`JoinRoomPage`) before request | FR-005 |
| Code matched case-insensitively, whitespace trimmed | Client + server (`.trim().toUpperCase()`) | FR-007 |
| Unknown code → not found | Server `joinRoom`/`getRoom` → 404 | FR-006 |
| Capacity ≤ 8 (after pruning) | Server `joinRoom` → 409 | FR-016 |
| Cannot join a `playing` room | Server `joinRoom` → 409 | FR-014 |
| Name trimmed, default `"Player"`, disambiguated | Server `createParticipant`/`joinRoom` | FR-017 |
| Start requires host | Server `startGame` → 403 if `participantId !== hostId` | FR-011 |
| Start requires ≥ 2 participants (after pruning) | Server `startGame` → 409 | FR-012 |

## State Transitions (Room lifecycle)

```text
            createRoom
                │
                ▼
        ┌───────────────┐   join (≤8, not started)      ┌───────────────┐
        │    lobby      │ ─────────────────────────────▶ │    lobby      │
        │ (host + ...)  │   poll: prune stale members    │ (more players)│
        └───────────────┘                                 └───────────────┘
                │                                                  │
                │ host starts (host + ≥2 players)                  │
                ▼                                                  │
        ┌───────────────┐                                          │
        │   playing     │  clients polling see status=playing      │
        │               │  → navigate all to /game                 │
        └───────────────┘                                          │
                                                                   │
   ANY state ──────────────────────────────────────────────────────┘
        │ host pruned/departs  →  DELETE room  (remaining players' next poll → 404 → ejected)   [FR-015]
        │ participants becomes empty → DELETE room                                              [FR-015a]
```

Transition triggers and guards:

| From | Event | Guard | To / Effect | FR |
|------|-------|-------|-------------|----|
| (none) | `createRoom` | — | `lobby`; creator = `hostId`; `lastSeenAt` set | FR-001, FR-002 |
| `lobby` | `joinRoom` | not full, status=`lobby` | `lobby` + new participant (name disambiguated) | FR-004, FR-014, FR-016, FR-017 |
| `lobby`/`playing` | `getRoom` poll | — | prune participants with `now - lastSeenAt > 10s`; refresh viewer's `lastSeenAt` | FR-010, FR-010a |
| `lobby` | `startGame` | requester is host AND ≥2 players | `playing` | FR-011, FR-012, FR-013 |
| `lobby`/`playing` | host pruned/departs | host no longer present | DELETE room | FR-015 |
| `lobby`/`playing` | last participant pruned | `participants.length === 0` | DELETE room | FR-015a |

## Isolation Note (FR-008)

Rooms are keyed independently in the `Map<code, Room>`; no shared mutable state crosses rooms. All reads/writes go through `code`, so one room's mutations (join, prune, start, delete) cannot affect another. Snapshots are deep-cloned (`structuredClone`) before returning, preventing cross-room or cross-request aliasing.
