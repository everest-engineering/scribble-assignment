# API Contract: POST /rooms/:code/skip-round

## Summary

Advances the round immediately (calls `advanceRound()`), skipping the current word. Available to host at all times during playing state. Rejected if a correct guess already exists in the current round.

## Request

**Method**: `POST`
**Path**: `/rooms/:code/skip-round`
**Content-Type**: `application/json`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | yes | Room code (case-insensitive, uppercased server-side) |

### Body (Zod: `skipRoundSchema`)

```ts
export const skipRoundSchema = z.object({
  playerId: z.string()
});
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| playerId | string | yes | Must match room's `hostId` |

## Response

### 200 OK

```json
{
  "room": RoomSnapshot
}
```

`RoomSnapshot` reflects advanced round state:
- `currentRound` incremented by 1
- New `drawerId` (round-robin selection)
- New `secretWord` (for the new drawer)
- `strokes` cleared
- `guessHistory` cleared
- `scores` preserved with roundScore reset to 0
- `lastRoundResult` set with the skipped round's data (correct word, scores)
- `skipSuggested` reset to false

### 400 Bad Request

```json
{ "message": "Round already ended" }
```

Returned when a correct guess already exists in `guessHistory` for the current round.

### 403 Forbidden

```json
{ "message": "Only the host can skip the round" }
```

Returned when `playerId` does not match `hostId`.

### 404 Not Found

```json
{ "message": "Room not found" }
```

Returned when room code does not exist.

## Backend Service

```ts
function skipRound(code: string, playerId: string): { room: RoomSnapshot } | { error: string }
```

### Logic

1. Look up room by code. Return null if not found.
2. If room.status !== "playing", return error.
3. If playerId !== room.hostId, return error.
4. Check if any guess in `room.guessHistory` has `correct: true`. If so, return error "Round already ended".
5. Call `advanceRound(code)` — this preserves the existing `advanceRound()` logic:
   - Sets `lastRoundResult` with current round data (scores unchanged since no one guessed correctly)
   - Increments `currentRound`
   - Picks new drawer (round-robin)
   - Picks new word
   - Clears strokes, guess history
   - Resets round scores to 0
   - Clears `skipSuggested`
6. Return updated room snapshot.

## Testing

- Skip round succeeds when host calls it during playing state
- Skip round creates `lastRoundResult` with correct word and current scores
- Skip round advances round counter, assigns new drawer
- Skip round clears strokes and guess history
- Skip round resets `skipSuggested`
- Non-host skip returns 403
- Skip after correct guess returns 400
- Skip when room is lobby returns 400
- Non-existent room returns 404
