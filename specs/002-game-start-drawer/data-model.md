# Phase 1 Data Model: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer
**Date**: 2026-06-02

This document captures every data shape touched by this feature. Backend
types live in `backend/src/models/game.ts` (authoritative); the frontend
mirrors them in `frontend/src/services/api.ts`.

## Backend types

### `Participant` (unchanged)

```ts
interface Participant {
  id: string;        // server-issued UUID v4
  name: string;      // trimmed at API boundary; empty rejected (FR-001, FR-002)
  joinedAt: string;  // ISO 8601 timestamp
}
```

**Notes**:
- `name` is now guaranteed non-empty by `createRoomSchema` / `joinRoomSchema`.
  The `displayName(name)` fallback to `"Player"` in `roomStore.ts` becomes
  unreachable in practice and may be simplified.

### `RoomStatus` (extended)

```ts
type RoomStatus = "lobby" | "playing";
```

**State transitions**:
- `lobby → playing` happens exactly once, on a successful
  `POST /rooms/:code/start`.
- No transition back to `lobby` is defined in this feature; Scenario 4
  (Restart) will add `playing → lobby`.

### `Round` (new)

```ts
interface Round {
  drawerParticipantId: string; // always equals room.hostParticipantId for this feature
  secretWord: string;          // one of STARTER_WORDS, deterministic from room.code
}
```

**Invariants**:
- `drawerParticipantId` is set once at round creation and never changes for
  the lifetime of the round (no drawer rotation in this scenario).
- `secretWord` is a member of `STARTER_WORDS`. Selection is `selectWord(code)`
  — see `research.md §Deterministic word selector`.
- The same `code` always yields the same `secretWord`. Re-creating the
  round (idempotent start) MUST NOT call the selector again — the existing
  `Round` is reused.

### `Room` (extended)

```ts
interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  currentRound: Round | null;  // NEW — null while status === "lobby"
  createdAt: string;
  updatedAt: string;
}
```

**Invariants**:
- `status === "lobby"` ↔ `currentRound === null`. Both sides of the bi-implication
  must hold at all times.
- When `status === "playing"`, `currentRound.drawerParticipantId` MUST equal
  one of the participants' ids — by construction, the host's.

**State transitions**:
- `Room` is created with `status: "lobby"`, `currentRound: null`.
- `join` appends to `participants` (allowed only while `status === "lobby"`).
- `start` (new) sets `status = "playing"` and `currentRound = { ... }` atomically.

### `RoomSnapshot` (extended, viewer-aware)

```ts
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  currentRound: SnapshotRound | null; // NEW — null while status === "lobby"
  availableWords: string[];           // preserved; unused in this feature
  roles: ParticipantRole[];           // preserved; unused in this feature
}

interface SnapshotRound {
  drawerParticipantId: string;
  secretWord: string | null;          // non-null ONLY when the viewer is the drawer
}
```

**Visibility rule** (cross-cutting; see also `contracts/snapshot-visibility-rules.md`):

```ts
function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.currentRound;
  const snapshotRound: SnapshotRound | null = round
    ? {
        drawerParticipantId: round.drawerParticipantId,
        secretWord: viewerParticipantId === round.drawerParticipantId
          ? round.secretWord
          : null
      }
    : null;
  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((p) => ({ ...p })),
    currentRound: snapshotRound,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
```

**Notes**:
- The `secretWord` payload key is always present when `currentRound !== null`.
  Its value (a string vs `null`) is the secrecy carrier; this keeps the
  client's parsing schema-stable.
- An absent or unknown `viewerParticipantId` is treated as a non-drawer
  (gets `secretWord: null`).

### `RoomSessionResponse` (unchanged shape; richer payload)

```ts
interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot; // now includes currentRound — null for lobby, populated post-start
}
```

## Frontend types (mirror)

```ts
// frontend/src/services/api.ts

interface SnapshotRound {
  drawerParticipantId: string;
  secretWord: string | null;
}

interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostParticipantId: string;
  participants: Participant[];
  currentRound: SnapshotRound | null;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

**Derivations** (component-local, no new state shapes):

```ts
const isHost = !!room && !!participantId && room.hostParticipantId === participantId;
const isDrawer = !!room?.currentRound && participantId === room.currentRound.drawerParticipantId;
const drawerName = (() => {
  if (!room?.currentRound) return null;
  const id = room.currentRound.drawerParticipantId;
  return room.participants.find((p) => p.id === id)?.name ?? null;
})();
```

## Cross-cutting validation

| Boundary | Validator | Inputs | Failure response |
|---|---|---|---|
| `POST /rooms` body | `createRoomSchema` | `{playerName: string}` — non-empty after trim | 400 `{message: "Enter your name"}` |
| `POST /:code/join` body | `joinRoomSchema` | same as above | 400 `{message: "Enter your name"}` |
| `POST /:code/join` route | service-layer guard | room exists AND status === "lobby" | 404 `"Room not found"` / 409 `"Room is no longer open to new players"` |
| `POST /:code/start` body | `startRoomSchema` (new) | `{participantId: string}` non-empty | 400 `{message: "Invalid request payload"}` |
| `POST /:code/start` route | service-layer guard | host-only AND ≥ 2 players AND room exists | 404 / 403 `"Only the host can start the game"` / 400 `"Need at least 2 players to start"` |

## Migration notes (in-memory only)

- No persisted data; the in-memory `Map<string, Room>` simply gains the
  new optional `currentRound` field for each room. Existing rooms (none at
  service start) would default to `currentRound: null`, which already
  matches lobby semantics.
- The starter `displayName(name)` fallback to `"Player"` becomes
  unreachable after schema tightening. Recommend removing it in the same
  commit that ships the schema change to keep the type story honest.
