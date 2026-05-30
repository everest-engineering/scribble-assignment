# API Contract: Round Result & Restart

## POST /rooms/:code/round/end

End the current round manually (or confirms auto-detected end). Transitions room status from `"playing"` to `"result"`.

### Request

```json
{
  "participantId": "string"
}
```

### Response (200)

```json
{
  "status": "result",
  "room": { /* RoomSnapshot with status "result" — currentWord visible to all */ }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| 404 | Room not found |
| 400 | No active round |
| 403 | Only the host can end the round |

---

## POST /rooms/:code/restart

Restart the game after a round has ended. Returns all players to lobby, clears round state, preserves participants. Only callable by host.

### Request

```json
{
  "participantId": "string"
}
```

### Response (200)

```json
{
  "status": "lobby",
  "room": { /* RoomSnapshot with status "lobby", currentRound null, scores empty */ }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| 404 | Room not found |
| 400 | Room is not in result state |
| 403 | Only the host can restart |

---

## GET /rooms/:code (extended)

Existing polling endpoint. When `room.status === "result"`, the `currentWord` field is included for ALL viewers (not just the drawer).

### Response (200) — result state

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "participants": [ /* unchanged */ ],
    "roundNumber": 1,
    "drawerId": "uuid",
    "currentWord": "apple",          /* visible to ALL players in result state */
    "strokes": [ /* final canvas state */ ],
    "guesses": [ /* full guess history */ ],
    "scores": { "player1": 200, "player2": 100, "player3": 0 }
  }
}
```

---

## RoomSnapshot Status-Specific Behavior

| Status | `currentWord` visibility | `strokes` | `guesses` | `scores` |
|--------|--------------------------|-----------|-----------|----------|
| `"lobby"` | Not included | Empty array | Empty array | Empty object |
| `"awaiting_rename"` | Not included | Empty array | Empty array | Empty object |
| `"playing"` | Drawer only | Active canvas | Active guesses | Running scores |
| `"result"` | **All players** | Final canvas | Full history | Final scores (ranked) |

## Type Changes

### RoomStatus (backend `game.ts`, frontend `api.ts`)

```typescript
// Before
export type RoomStatus = "lobby" | "awaiting_rename" | "playing";

// After
export type RoomStatus = "lobby" | "awaiting_rename" | "playing" | "result";
```

### Schemas (backend `schemas.ts`)

```typescript
export const roundEndBodySchema = z.object({
  participantId: z.string()
});

export const restartBodySchema = z.object({
  participantId: z.string()
});
```
