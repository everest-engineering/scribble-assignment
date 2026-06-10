# Data Model: Result, Restart & Final Validation

## Changes to Existing Entities

### Room (backend `models/game.ts`)

Add one new field alongside the existing `scores` (cumulative) field:

| Field | Type | Description |
|-------|------|-------------|
| `roundScores` | `Record<string, number>` | Points earned by each participant **in the current round only**. Reset to `{}` at the start of each round and cleared on restart. |

`scores` continues to hold the cumulative total across all rounds in the session.

**State transitions**:

```
lobby ──startGame()──→ active ──submitGuess(correct)──→ completed ──restartGame()──→ lobby
```

### RoomSnapshot (shared shape sent to clients)

Add `roundScores` field (same type, same semantics as `Room.roundScores`).

`secretWord` reveal rule change: currently sent only to the drawer (`isDrawer`). After this
feature, sent to **all** participants when `status === "completed"`.

### Guess (no changes)

Existing shape is sufficient: `{ participantId, text, isCorrect, submittedAt }`.

---

## Service Logic Changes

### `startGame(code, participantId)` → `roomStore.ts`

- Initialize `roundScores` to `{}` for all participants (same pattern as `scores`).
- `scores` (cumulative) continues to be initialized to `0` on the **first** `startGame` call; on
  subsequent calls (after restart) it is already set and must not be reset.

> **Important**: `startGame` must only zero-out `roundScores`, never `scores`.

### `submitGuess(code, participantId, text)` → `roomStore.ts`

- Accumulate `scoreAwarded` into **both** `room.roundScores[participantId]` and
  `room.scores[participantId]`.
- After recording the guess: if `isCorrect`, set `room.status = "completed"`.
- Return value shape unchanged; callers already receive the updated `RoomSnapshot`.

### `restartGame(code, participantId)` → `roomStore.ts` (NEW)

Inputs: `code: string`, `participantId: string`

Returns: `RoomSnapshot | null`

Logic:
1. Look up room — return `null` if not found.
2. Return `null` if `participantId !== room.hostId`.
3. Set `room.status = "lobby"`.
4. Clear `room.drawerId = null`, `room.secretWord = null`, `room.guesses = []`,
   `room.roundScores = {}`.
5. Leave `room.participants` and `room.scores` (cumulative) unchanged.
6. Save and return `toRoomSnapshot(room, participantId)`.

### `toRoomSnapshot(room, viewerParticipantId)` → `roomStore.ts`

- Add `roundScores: { ...room.roundScores }` to the returned object.
- Change secret word reveal: `secretWord: (isDrawer || room.status === "completed") ? room.secretWord : null`.

---

## Frontend Type Changes (`services/api.ts`)

Add `roundScores: Record<string, number>` to `RoomSnapshot`.

No other type changes needed.

---

## Routing Addition

| Route | Component | Navigation away |
|-------|-----------|-----------------|
| `/results` | `ResultsPage` | → `/lobby` when `room.status === "lobby"` (restart detected) |

`LobbyPage` already navigates → `/game` on `status === "active"`. Add: → `/results` on
`status === "completed"` (in case a player lands in lobby while the round already ended).

`GamePage` add: → `/results` when `room.status === "completed"`.
