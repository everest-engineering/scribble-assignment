# API Contract: Rooms (Scenario 4 additions)

Base URL: `http://localhost:3001`  
Content-Type: `application/json`

Builds on Scenarios 1–3 endpoints.

## POST /rooms/:code/restart

Return room to lobby after round ends; host-only; result state only.

**Request body**

```json
{
  "participantId": "<host-uuid>"
}
```

**Validation**

- `participantId`: required string
- Caller must be `hostParticipantId`
- `status === "result"`

**Response 200**

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "...",
    "participants": [ /* preserved */ ]
  }
}
```

No `currentRound` in response.

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid body | Zod message |
| 403 | Not host | `"Only the host can restart the game"` |
| 404 | Unknown code | `"Unable to restart game"` |
| 409 | Not result | `"Game is not in result state"` |

## GET /rooms/:code (result snapshot change)

When `status === "result"` and `currentRound` present:

```json
{
  "status": "result",
  "currentRound": {
    "secretWord": "rocket",
    "guesses": [ /* full history */ ],
    "scores": [ /* final scores */ ],
    "winnerParticipantId": "..."
  }
}
```

`secretWord` is **non-null for all viewers** (including guessers).

When `status === "playing"`, masking unchanged — guessers see `secretWord: null`.

## Out of scope

- Persistent score across restarts
- Drawer rotation API
