# Phase 1 Data Model: Result, Restart & Final Validation

**Feature**: 004-result-restart
**Date**: 2026-06-03

This document captures every data shape touched by this feature. The model
extensions are all small relative to Scenarios 1 → 3; the heavy lifting is
in the snapshot filter (`toRoomSnapshot`) which gains a single new
conditional.

## Backend types

### `RoomStatus` (extended)

```ts
type RoomStatus = "lobby" | "playing" | "result";
```

**State transitions** (cumulative across Scenarios 1 → 4):

```text
lobby --start--> playing --end--> result --restart--> lobby
```

- `lobby → playing`: Scenario 2's `POST /:code/start` (host + ≥ 2 players).
- `playing → result`: this feature's `POST /:code/end` (host only).
- `result → lobby`: this feature's `POST /:code/restart` (host only).

There are no other allowed transitions in this feature. The existing
backwards arrows (e.g., `playing → lobby` mid-round) are explicitly out
of scope per the spec's Assumption §4 (no abort shortcut).

### `Room` (unchanged structurally; values change on transitions)

```ts
interface Room {
  code: string;
  status: RoomStatus;            // widened union
  hostParticipantId: string;
  participants: Participant[];
  currentRound: Round | null;
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}
```

**Invariants** (extended):

- `status === "lobby"` ↔ `currentRound === null` (Scenario 2 invariant preserved).
- `status === "playing"` ⇒ `currentRound !== null`.
- `status === "result"` ⇒ `currentRound !== null` (the round data is retained for display).
- On restart, every `Participant.score === 0`, `guesses === []`,
  `currentRound === null`, `status === "lobby"`.

### `Participant` and `Guess` (unchanged)

No new fields. `Participant.score` continues to carry the final score
into the result state; the value the result view displays is the same
value the in-play scoreboard last displayed.

## Snapshot visibility (extended)

`toRoomSnapshot(room, viewerParticipantId)` gains one conditional that
short-circuits the Scenarios 2 + 3 redaction rules when the room is in
the result state.

```ts
function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.currentRound;
  const drawerId = round?.drawerParticipantId;
  const isResultState = room.status === "result";

  // currentRound.secretWord visibility
  const snapshotRound: SnapshotRound | null = round
    ? {
        drawerParticipantId: round.drawerParticipantId,
        secretWord:
          isResultState || viewerParticipantId === round.drawerParticipantId
            ? round.secretWord
            : null
      }
    : null;

  // guesses[].text visibility
  const snapshotGuesses = room.guesses.map((entry) => {
    const isPrivilegedViewer =
      viewerParticipantId === entry.guesserParticipantId ||
      (drawerId !== undefined && viewerParticipantId === drawerId);
    const text =
      isResultState || !entry.isCorrect || isPrivilegedViewer
        ? entry.text
        : null;
    return {
      id: entry.id,
      guesserParticipantId: entry.guesserParticipantId,
      text,
      isCorrect: entry.isCorrect,
      submittedAt: entry.submittedAt,
      order: entry.order
    };
  });

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    currentRound: snapshotRound,
    guesses: snapshotGuesses,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
```

**Invariants** (extended):

- `status === "lobby"` ⇒ `currentRound === null` (snapshot reflects model).
- `status === "playing"` ⇒ Scenario 2 + Scenario 3 visibility rules apply.
- `status === "result"` ⇒ `currentRound.secretWord` is the real word for
  every viewer AND every entry in `guesses[]` carries its real text for
  every viewer (overrides both Scenario 2 and Scenario 3 redactions).

## State transitions (this feature)

### `endRound(code, participantId)`

| Branch | Returns | Server-visible effect |
|---|---|---|
| Code not in store | `null` | none |
| `participantId !== room.hostParticipantId` | `{error: "not-host"}` | none |
| `status !== "playing"` | `{error: "wrong-state"}` | none |
| Otherwise | `{room: cloned}` | `room.status = "result"`, `room.updatedAt` bumped |

`currentRound` and `guesses` are preserved verbatim. Scores are
preserved verbatim. The transition is value-preserving for data; only
`status` changes.

### `restartRoom(code, participantId)`

| Branch | Returns | Server-visible effect |
|---|---|---|
| Code not in store | `null` | none |
| `participantId !== room.hostParticipantId` | `{error: "not-host"}` | none |
| `status !== "result"` | `{error: "wrong-state"}` | none |
| Otherwise | `{room: cloned}` | for each `participant`, `score = 0`; `room.guesses = []`; `room.currentRound = null`; `room.status = "lobby"`; `room.updatedAt` bumped |

`participants[]` and `hostParticipantId` are preserved verbatim.

## Frontend types (mirror)

```ts
// frontend/src/services/api.ts

interface RoomSnapshot {
  // ...existing fields...
  status: "lobby" | "playing" | "result";  // widened
}
```

No new types on the frontend — the existing `SnapshotRound`,
`SnapshotGuess`, `Participant` shapes are unchanged. The status union
just gains one value.

**Derivations** (component-local, no new state shapes):

```ts
const isResult = room?.status === "result";
const isHost = !!room && !!participantId && room.hostParticipantId === participantId;
```

## Cross-cutting validation

| Boundary | Validator | Inputs | Failure response |
|---|---|---|---|
| `POST /:code/end` body | `endRoundSchema` (alias of `startRoomSchema`) | `{participantId: string}` non-empty | 400 `{message: "Invalid request payload"}` |
| `POST /:code/end` route | service-layer guard | room exists; host; status === "playing" | 404 / 403 / 409 with explicit messages (see `contracts/POST_rooms_code_end.md`) |
| `POST /:code/restart` body | `restartRoomSchema` (alias of `startRoomSchema`) | `{participantId: string}` non-empty | 400 `{message: "Invalid request payload"}` |
| `POST /:code/restart` route | service-layer guard | room exists; host; status === "result" | 404 / 403 / 409 with explicit messages (see `contracts/POST_rooms_code_restart.md`) |

## Migration notes (in-memory only)

- No persisted data; the in-memory `Map<string, Room>` simply gains a
  third status value on existing rooms. Rooms in the lobby or playing
  state are unaffected.
- Existing Scenario 2 + 3 tests that compare `status === "playing"`
  continue to pass; tests that pattern-match the union exhaustively
  (none currently) would need a `"result"` arm.
