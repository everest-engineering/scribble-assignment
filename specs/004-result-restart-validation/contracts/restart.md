# API Contract: POST /rooms/:code/restart

## Summary

Resets the room to lobby status, clearing all game state while preserving participants and hostId. Host-only action.

## Request

**Method**: `POST`
**Path**: `/rooms/:code/restart`
**Content-Type**: `application/json`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | yes | Room code (case-insensitive, uppercased server-side) |

### Body (Zod: `restartGameSchema`)

```ts
export const restartGameSchema = z.object({
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

`RoomSnapshot` includes:
- `status: "lobby"` after restart
- All original `participants` preserved
- All game state cleared: no `currentRound`, `drawerId`, `secretWord`, `strokes`, `guessHistory`, `scores`, `lastRoundResult`

### 400 Bad Request

```json
{ "message": "Game is not in progress" }
```

Returned when room status is not "playing".

### 403 Forbidden

```json
{ "message": "Only the host can restart the game" }
```

Returned when `playerId` does not match `hostId`.

### 404 Not Found

```json
{ "message": "Room not found" }
```

Returned when room code does not exist.

## Backend Service

```ts
function restartGame(code: string, participantId: string): RoomSnapshot | null
```

### Logic

1. Look up room by code. Return null if not found.
2. If room.status !== "playing", return null (caller returns 400).
3. If participantId !== room.hostId, return null (caller returns 403).
4. Reset room:
   - `room.status = "lobby"`
   - `room.currentRound = undefined`
   - `room.drawerId = undefined`
   - `room.secretWord = undefined`
   - `room.strokes = []`
   - `room.guessHistory = []`
   - `room.scores = {}`
   - `room.lastRoundResult = undefined`
   - `room.lastRoundResultSetAt = undefined`
   - `room.skipSuggested = false`
   - `room.updatedAt = now()`
5. Save room, return snapshot via `toRoomSnapshot()`.

### State Transition

```
playing → restartGame() → lobby
```

## Testing

- Restart from playing state succeeds, returns lobby with participants preserved
- Restart from lobby returns 400
- Non-host restart returns 403
- Non-existent room returns 404
- After restart, scores/strokes/guessHistory/lastRoundResult are all empty/undefined
- After restart, new game can be started from lobby
