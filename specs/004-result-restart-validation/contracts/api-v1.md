# API v1: Result, Restart & Final Validation

## POST /rooms/:code/return-to-lobby

**Purpose**: Transition room from `round_end` back to `lobby` state (host only).

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "transitioned": true,
  "status": "lobby"
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 403 | Participant is not the host |
| 404 | Room not found |
| 409 | Room is not in `"round_end"` status, or already at max rounds |
| 400 | Missing or invalid participantId |

---

## POST /rooms/:code/start-round

**Purpose**: Start a new round from the lobby (host only). Validates round limit, assigns drawer/word, resets round state.

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "started": true,
  "roundNumber": 2,
  "maxRounds": 4
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 403 | Participant is not the host |
| 404 | Room not found |
| 409 | Room is not in `"lobby"` status, or `roundCounter >= maxRounds`, or fewer than 2 participants |
| 400 | Missing or invalid participantId |

---

## POST /rooms/:code/leave

**Purpose**: Remove a participant from the room (any participant, from `round_end`, `lobby`, or `game_over` states). Triggers host transfer if the host leaves.

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "left": true,
  "hostTransferred": false,
  "newHostId": "uuid-of-remaining-participant"
}
```

If host was transferred:

```json
{
  "left": true,
  "hostTransferred": true,
  "newHostId": "uuid-of-new-host"
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid participantId |
| 404 | Room not found / participant not in room |
| 409 | Room is in `"playing"` status and participant is the drawer (drawer cannot leave mid-round) |

---

## GET /rooms/:code (extended)

**Existing endpoint** extended with session state.

### Extended Fields

All existing fields unchanged. New fields:

| Field | Type | Visible When |
|-------|------|--------------|
| `status` | `string` | **CHANGED** from `"playing" \| "finished"` to `"lobby" \| "playing" \| "round_end" \| "game_over"` |
| `roundCounter` | `number` | Always |
| `maxRounds` | `number` | Always |
| `roundResult` | `object?` | `status === "round_end"` |
| `finalStandings` | `array?` | `status === "game_over"` |
| `hostId` | `string` | Always (may change on host transfer) |

### Example (round_end state)

```json
{
  "room": {
    "code": "ABCD",
    "status": "round_end",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "role": "drawer" },
      { "id": "uuid-2", "name": "Bob", "role": "guesser" },
      { "id": "uuid-3", "name": "Charlie", "role": "guesser" }
    ],
    "hostId": "uuid-1",
    "roundCounter": 1,
    "maxRounds": 3,
    "secretWord": "rocket",
    "scores": { "uuid-1": 0, "uuid-2": 100, "uuid-3": 0 },
    "guessLog": [
      { "participantId": "uuid-3", "text": "pizza", "correct": false, "timestamp": "..." },
      { "participantId": "uuid-2", "text": "rocket", "correct": true, "timestamp": "..." },
      { "participantId": "uuid-3", "text": "castle", "correct": false, "timestamp": "..." }
    ],
    "roundResult": {
      "secretWord": "rocket",
      "scores": { "uuid-1": 0, "uuid-2": 100, "uuid-3": 0 },
      "roundScores": { "uuid-1": 0, "uuid-2": 100, "uuid-3": 0 },
      "correctGuessers": ["uuid-2"],
      "allCorrect": false,
      "endedEarly": true,
      "roundNumber": 1
    }
  }
}
```

### Example (game_over state)

```json
{
  "room": {
    "code": "ABCD",
    "status": "game_over",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "role": "drawer" },
      { "id": "uuid-2", "name": "Bob", "role": "guesser" },
      { "id": "uuid-3", "name": "Charlie", "role": "guesser" }
    ],
    "hostId": "uuid-1",
    "roundCounter": 3,
    "maxRounds": 3,
    "scores": { "uuid-1": 0, "uuid-2": 200, "uuid-3": 100 },
    "finalStandings": [
      { "participantId": "uuid-2", "name": "Bob", "score": 200, "rank": 1 },
      { "participantId": "uuid-3", "name": "Charlie", "score": 100, "rank": 2 },
      { "participantId": "uuid-1", "name": "Alice", "score": 0, "rank": 3 }
    ],
    "roundResult": {
      "secretWord": "guitar",
      "scores": { "uuid-1": 0, "uuid-2": 200, "uuid-3": 100 },
      "roundScores": { "uuid-1": 0, "uuid-2": 100, "uuid-3": 0 },
      "correctGuessers": ["uuid-2"],
      "allCorrect": false,
      "endedEarly": false,
      "roundNumber": 3
    }
  }
}
```

## BREAKING CHANGE: Room Status Enum

The `status` field on the Room model and in all snapshots changes from:

```
"lobby" | "playing" | "finished"
```

to:

```
"lobby" | "playing" | "round_end" | "game_over"
```

The `"finished"` value is **removed**. Any frontend code checking for `status === "finished"` must be updated to check for `status === "round_end"` or `status === "game_over"` as appropriate. The existing frontend from spec 003 must be updated to handle the new status values.
