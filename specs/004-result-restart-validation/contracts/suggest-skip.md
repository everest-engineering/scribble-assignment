# API Contract: POST /rooms/:code/suggest-skip

## Summary

Allows any participant to signal to the host that they want the round skipped. Sets a `skipSuggested` flag on the room. Host sees a visual badge on the Skip Round button.

## Request

**Method**: `POST`
**Path**: `/rooms/:code/suggest-skip`
**Content-Type**: `application/json`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | yes | Room code (case-insensitive, uppercased server-side) |

### Body (Zod: `suggestSkipSchema`)

```ts
export const suggestSkipSchema = z.object({
  participantId: z.string()
});
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participantId | string | yes | Must exist in room's `participants[]` |

## Response

### 200 OK

```json
{
  "room": RoomSnapshot
}
```

`RoomSnapshot` includes `skipSuggested: true`.

### 400 Bad Request

```json
{ "message": "Game is not in progress" }
```

Returned when room status is not "playing".

### 404 Not Found

```json
{ "message": "Room not found" }
```

Returned when room code does not exist.

### 404 Not Found (participant)

```json
{ "message": "Participant not found" }
```

Returned when `participantId` does not match any participant in the room.

## Backend Service

```ts
function suggestSkip(code: string, participantId: string): RoomSnapshot | null
```

### Logic

1. Look up room by code. Return null if not found.
2. If room.status !== "playing", return null (caller returns 400).
3. Find participant in `room.participants`. Return null if not found (caller returns 404).
4. Set `room.skipSuggested = true`.
5. Save room, return snapshot via `toRoomSnapshot()`.

### skipSuggested Lifecycle

- **Set**: by `POST /:code/suggest-skip`
- **Cleared**: by `advanceRound()` (called from skip-round or correct guess) and by `restartGame()`
- **Read**: in `toRoomSnapshot()` — included as `skipSuggested` in `RoomSnapshot`

## Testing

- Suggest skip succeeds for any participant during playing state
- Suggest skip sets `skipSuggested: true` in snapshot
- Suggest skip when room is lobby returns 400
- Suggest skip for non-existent participant returns 404
- After advanceRound, skipSuggested resets to false
- After restartGame, skipSuggested resets to false
