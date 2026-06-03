# Phase 1 Data Model: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-02

This document captures the data shapes touched by this feature. Backend types
live in `backend/src/models/game.ts` (server) and are mirrored as input/output
types in `frontend/src/services/api.ts`. The frontend additionally maintains a
small `LocalIdentity` shape in browser `localStorage`.

## Backend types

### `Participant` (unchanged)

```ts
interface Participant {
  id: string;        // server-issued UUID v4
  name: string;      // raw player name as supplied; empty fallback handled by displayName()
  joinedAt: string;  // ISO 8601 timestamp
}
```

**Notes**:
- `id` is the canonical handle for a player inside a room. It is the value the
  frontend stores in `localStorage` to reclaim host status on refresh.
- Name validation (trim, reject empty) is owned by Scenario 2 and is *not*
  tightened here. Display fallback to `"Player"` continues to apply if the
  client sends an empty name.

### `Room` (extended)

```ts
type RoomStatus = "lobby"; // future scenarios may extend

interface Room {
  code: string;                  // 4 uppercase letters A–Z
  status: RoomStatus;
  hostParticipantId: string;     // NEW — id of the participant who created the room
  participants: Participant[];   // ordered by join time
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601 — bumped on every mutation
}
```

**Invariants**:
- `code` matches `/^[A-Z]{4}$/`.
- `code` is unique across all entries in the in-memory `Map<string, Room>`.
- `hostParticipantId` is set once at creation and never reassigned in this
  feature. It always equals one of `participants[*].id`, by construction at
  create time, even if that participant later closes their browser.
- `participants[0]` is the host's `Participant` at creation time. Later joiners
  are appended in order; nothing in the model relies on participants[0] being
  the host after that initial moment — use `hostParticipantId`.

**State transitions**:
- `Room` is created with `status: "lobby"` and immediately one participant.
- `join` appends to `participants` and bumps `updatedAt`.
- This feature does not introduce any other transitions; `status` will move to
  later values in subsequent scenarios.

### `RoomSnapshot` (extended)

```ts
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;     // NEW — exposed to clients
  participants: Participant[];   // shallow-cloned to prevent mutation aliasing
  availableWords: string[];      // preserved from starter; unused this feature
  roles: ParticipantRole[];      // preserved from starter; unused this feature
}
```

**Notes**:
- `hostParticipantId` is what lets each client compute `isHost` against its own
  locally stored `participantId` without trusting any client-supplied flag.
- `availableWords` and `roles` continue to ship in the snapshot for
  forward-compatibility with Scenarios 2–4; they are not consumed by Scenario
  1 UI.

### `RoomSessionResponse` (unchanged)

```ts
interface RoomSessionResponse {
  participantId: string; // the caller's own participant id
  room: RoomSnapshot;
}
```

Returned from `POST /rooms` and `POST /rooms/:code/join`. The caller stores
`participantId` in `localStorage` immediately after success.

## Frontend types

### `RoomState` (extended)

```ts
interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}
```

The existing shape is preserved; no new fields are needed because `isHost` is
derived, not stored. The derivation lives in a selector:

```ts
function selectIsHost(state: RoomState): boolean {
  if (!state.room || !state.participantId) return false;
  return state.room.hostParticipantId === state.participantId;
}
```

### `LocalIdentity` (new — `localStorage` shape)

```ts
interface LocalIdentity {
  participantId: string;
  role: "host" | "guest";
}
```

**Storage key**: `scribble:identity:${roomCode}` where `roomCode` is the
already-uppercase code (e.g., `scribble:identity:ABCD`).

**Lifecycle**:
- **Write at create**: `CreateRoomPage` writes `{participantId, role: "host"}`
  after a successful `POST /rooms`.
- **Write at join**: `JoinRoomPage` writes `{participantId, role: "guest"}`
  after a successful `POST /rooms/:code/join`.
- **Read at lobby mount**: `LobbyPage` reads
  `scribble:identity:<roomCode>` to restore the participant identity when the
  in-memory `RoomState.participantId` is `null` (i.e., the tab was refreshed).
- **Cleared**: the lab does not actively clear identity. When the lab moves to
  later scenarios that introduce restart, those features may clear it; this
  feature does not.

**Failure mode**:
- If `localStorage.getItem` / `setItem` throws (private mode, locked storage),
  the helper returns `null` and the lobby treats the viewer as a fresh joiner.
  Host status is then determined only by the in-memory `participantId`
  delivered by the create/join response; a refresh in this fallback state
  loses host status, consistent with the spec edge case.

**Note on the `role` field**:
- `role` is for client-side UI consistency only. The server never trusts it —
  the only authoritative host check is `hostParticipantId === participantId`.
  We keep `role` in the stored value for future telemetry / display, but the
  Lobby's `isHost` derivation must never read it.

## Cross-cutting validation

| Boundary | Validator | Inputs | Failure response |
|---|---|---|---|
| `POST /rooms` body | `createRoomSchema` | `{playerName?: string}` | 400 `{message: "Invalid request payload"}` |
| `POST /rooms/:code/join` params | `roomCodeParamsSchema` | `code` non-empty after trim | 400 `{message: "Enter a room code"}` |
| `POST /rooms/:code/join` body | `joinRoomSchema` | `{playerName?: string}` | 400 `{message: "Invalid request payload"}` |
| `GET /rooms/:code` params | `roomCodeParamsSchema` | as above | 400 `{message: "Enter a room code"}` |
| Room lookup (any endpoint) | service-layer guard | code exists in `Map` | 404 `{message: "Room not found"}` |

Empty/whitespace-only join code rejection (spec FR-005, FR-006) is implemented
at the schema layer so the same rule covers both the join and snapshot
endpoints without duplication.
