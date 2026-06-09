# API Contracts: Post Game Experience

**Feature**: Post Game Experience | **Date**: 2026-06-09 | **Plan**: `specs/004-post-game-experience/plan.md`

**Base URL**: `http://localhost:3001`

## POST /rooms/:code/restart

Restart the game. Resets room to lobby status, clears round state, retains participant list. Only the host can restart. Only valid when round phase is "finished".

### Request

```json
{
  "participantId": "uuid-abc-123"
}
```

### Response (200)

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "...", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-abc-123",
    "drawerId": null,
    "phase": null,
    "wordOptions": null,
    "secretWord": null,
    "availableWords": [...],
    "roles": [...],
    "strokes": [],
    "guesses": []
  }
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 403 | Not the host | `"Only the host can restart the game"` |
| 400 | Game not in finished state | `"Game is not in a finished state"` |
| 404 | Room not found | `"Unable to load room"` |

## GET /rooms/:code?participantId=uuid

**Updated behavior**: When `room.round.phase === "finished"`, the `secretWord` field is now revealed to ALL viewers (not just the drawer). The `guesses` array returns `isCorrect` with actual values for all guesses (not filtered), since the round is over.

### Response (200) — finished phase diff:

```json
{
  "room": {
    "status": "in-progress",
    "phase": "finished",
    "secretWord": "cat",
    "guesses": [
      {
        "participantId": "uuid-abc-456",
        "participantName": "Second Pencil",
        "text": "dog",
        "isCorrect": false,
        "guessedAt": "..."
      },
      {
        "participantId": "uuid-abc-456",
        "participantName": "Second Pencil",
        "text": "cat",
        "isCorrect": true,
        "guessedAt": "..."
      }
    ]
  }
}
```

**Visibility changes when phase == "finished"**:
- `secretWord`: visible to all players
- `guesses[].isCorrect`: actual value visible to all players (no filtering)

## Type Changes

### RoundPhase (extended)

```typescript
type RoundPhase = "word-selection" | "drawing" | "finished";
```
