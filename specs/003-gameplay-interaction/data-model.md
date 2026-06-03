# Phase 1 Data Model: Gameplay Interaction

**Feature**: 003-gameplay-interaction
**Date**: 2026-06-02

This document captures every data shape touched by this feature. Backend
types live in `backend/src/models/game.ts`; the frontend mirrors them in
`frontend/src/services/api.ts`.

## Backend types

### `Participant` (extended)

```ts
interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;   // NEW — 0 at create/join; reset to 0 in startRoom; +100 per first correct guess (FR-005, FR-010)
}
```

**Invariants**:
- `score >= 0` at all times.
- `score` is a multiple of 100 (only 0 or 100 in this scenario, given the cap).
- At round start (`startRoom`), every participant in the room has `score === 0`.

### `Guess` (new — server)

```ts
interface Guess {
  id: string;                       // server-issued UUID v4
  guesserParticipantId: string;     // refers to Participant.id
  text: string;                     // trimmed, original casing preserved
  isCorrect: boolean;
  submittedAt: string;              // ISO 8601
  order: number;                    // zero-based; assigned from room.guesses.length at append
}
```

**Invariants**:
- `text.length > 0` (the schema rejects empty / whitespace-only before service ever sees it).
- `text === text.trim()` (no surrounding whitespace).
- `order` is contiguous and monotonic within `Room.guesses`.
- `isCorrect === (text.toLowerCase() === room.currentRound.secretWord.toLowerCase())`.

### `SnapshotGuess` (new — viewer-aware)

```ts
interface SnapshotGuess {
  id: string;
  guesserParticipantId: string;
  text: string | null;     // null carries the redaction (see snapshot-visibility-rules.md)
  isCorrect: boolean;
  submittedAt: string;
  order: number;
}
```

**Visibility rule** (cross-cutting; see also
`contracts/snapshot-visibility-rules.md`):

```ts
function buildSnapshotGuess(
  entry: Guess,
  viewerParticipantId: string | undefined,
  drawerParticipantId: string | undefined
): SnapshotGuess {
  const isPrivileged =
    viewerParticipantId === entry.guesserParticipantId ||
    (drawerParticipantId !== undefined && viewerParticipantId === drawerParticipantId);
  const text = entry.isCorrect && !isPrivileged ? null : entry.text;
  return {
    id: entry.id,
    guesserParticipantId: entry.guesserParticipantId,
    text,
    isCorrect: entry.isCorrect,
    submittedAt: entry.submittedAt,
    order: entry.order
  };
}
```

### `Room` (extended)

```ts
interface Room {
  // ...existing fields...
  guesses: Guess[];   // NEW — initialized to [] in startRoom; append-only thereafter
}
```

**Invariants**:
- `guesses === []` while `status === "lobby"` (set in `startRoom` at the same moment as `status = "playing"`).
- `guesses[i].order === i` for all valid `i`.

### `RoomSnapshot` (extended, viewer-aware)

```ts
interface RoomSnapshot {
  // ...existing fields...
  guesses: SnapshotGuess[];   // NEW
}
```

**Invariants**:
- `snapshot.guesses.length === room.guesses.length` (no entries hidden — only `text` is redacted).
- `snapshot.guesses[i].order === room.guesses[i].order`.
- For every entry `e` in `snapshot.guesses`: `e.isCorrect === true && viewerParticipantId !== e.guesserParticipantId && viewerParticipantId !== currentRound.drawerParticipantId` ⇒ `e.text === null`.
- Otherwise `e.text === room.guesses[<corresponding index>].text`.

## Frontend types (mirror)

```ts
// frontend/src/services/api.ts

interface SnapshotGuess {
  id: string;
  guesserParticipantId: string;
  text: string | null;
  isCorrect: boolean;
  submittedAt: string;
  order: number;
}

interface Participant {
  // ...existing fields...
  score: number;
}

interface RoomSnapshot {
  // ...existing fields...
  guesses: SnapshotGuess[];
}
```

**Derivations** (component-local, no new state shapes):

```ts
const isDrawer = !!room?.currentRound && participantId === room.currentRound.drawerParticipantId;

const sortedGuesses = [...(room?.guesses ?? [])].sort((a, b) => a.order - b.order);

function renderGuessText(entry: SnapshotGuess): string {
  if (entry.text !== null) return entry.text;
  return "<correct guess>";   // client-chosen placeholder for redacted entries
}

const scoreFor = (participantId: string) =>
  room?.participants.find((p) => p.id === participantId)?.score ?? 0;
```

## Cross-cutting validation

| Boundary | Validator | Inputs | Failure response |
|---|---|---|---|
| `POST /:code/guess` body | `submitGuessSchema` (new) | `{participantId: string, text: string}` — text trimmed and non-empty | 400 `{message: "Enter a guess"}` for empty/whitespace text; 400 `{message: "Invalid request payload"}` for missing/malformed fields |
| `POST /:code/guess` route | service-layer guard | status === "playing"; participant exists; participant != drawer | 404 `"Room not found"` / 409 `"Round has not started"` / 403 `"Only guessers can submit guesses"` |

## State transitions

| Trigger | Before | After |
|---|---|---|
| `createRoom`, `joinRoom` | n/a | New `Participant` with `score: 0` |
| `startRoom` (success) | `room.status === "lobby"`, `room.guesses` undefined or stale | `room.status = "playing"`, every `Participant.score = 0`, `room.guesses = []` |
| `submitGuess` (correct, first by this guesser) | guesser.score = 0 | `room.guesses.push(entry)`, `entry.isCorrect = true`, `guesser.score = 100` |
| `submitGuess` (correct, repeat by same guesser) | guesser.score = 100 | `room.guesses.push(entry)`, `entry.isCorrect = true`, `guesser.score = 100` (unchanged) |
| `submitGuess` (incorrect) | any | `room.guesses.push(entry)`, `entry.isCorrect = false`, score unchanged |

## Migration notes (in-memory only)

- Existing in-flight rooms (none at service start, since the backend is
  in-memory) would not have `score` or `guesses` fields if they pre-existed
  this change. None do; this is a clean extension.
- The starter's `Participant` type previously had no `score` field; tests
  that build a participant literal will need to include `score: 0`.
- The starter's `Room` type previously had no `guesses` field; tests that
  build a room literal will need to include `guesses: []` (or rely on a
  helper that defaults it).
